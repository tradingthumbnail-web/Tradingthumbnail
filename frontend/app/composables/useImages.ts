import type { Image } from '~~/server/database/schemas/image.schema';

type BranchSummary = {
    id: string | null;
    name: string;
    count: number;
    headImage?: Image;
};

export function useImages() {
    const imageStore = useImageStore();

    const selectedBranchId = ref<string | null | 'ALL'>('ALL');

    const currentRootId = computed<string | null>(() => {
        const selected = imageStore.selectedImage as Image | null;
        if (!selected) return null;
        return selected.rootId || selected.id;
    });

    const timelineImages = computed<Image[]>(() => {
        if (!currentRootId.value) return [] as Image[];
        return (imageStore.images as Image[])
            .filter((i: Image) => (i.rootId === currentRootId.value || i.id === currentRootId.value));
    });

    const branches = computed<BranchSummary[]>(() => {
        const groups = new Map<string | null, BranchSummary>();
        for (const img of timelineImages.value) {
            const key = img.branchId ?? null;
            const existing = groups.get(key) || {
                id: key,
                name: key ? `branch ${String(key).slice(0, 6)}` : 'main',
                count: 0,
                headImage: undefined,
            } as BranchSummary;
            existing.count += 1;
            if (!existing.headImage) {
                existing.headImage = img;
            } else {
                const prev = new Date(existing.headImage.createdAt as any).getTime();
                const now = new Date(img.createdAt as any).getTime();
                if (now > prev) existing.headImage = img;
            }
            groups.set(key, existing);
        }
        // Sort: main first, then by name
        return Array.from(groups.values()).sort((a, b) => {
            if (a.name === 'main' && b.name !== 'main') return -1;
            if (b.name === 'main' && a.name !== 'main') return 1;
            return a.name.localeCompare(b.name);
        });
    });

    const versionsForSelectedBranch = computed<Image[]>(() => {
        const sorted = timelineImages.value.slice().sort((a: any, b: any) =>
            new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime()
        );
        if (selectedBranchId.value === 'ALL') return sorted;
        const target = selectedBranchId.value;
        return sorted.filter((i: Image) => (target === null ? i.branchId == null : i.branchId === target));
    });

    // --- Tree layout computation ---
    type TreeItem = {
        image: Image;
        lane: number;
        parentLane: number | null;
        isSplitFromParent: boolean;
        hasMultipleChildren: boolean;
        hasPrevOnLane: boolean;
        hasNextOnLane: boolean;
    };

    const treeItems = computed<TreeItem[]>(() => {
        const images = timelineImages.value.slice();
        if (!images.length) return [];

        // Indexes
        const byId = new Map<string, Image>();
        const childrenOf = new Map<string, Image[]>();
        for (const img of images) {
            byId.set(img.id, img);
            if (img.parentId) {
                const list = childrenOf.get(img.parentId) || [];
                list.push(img);
                childrenOf.set(img.parentId, list);
            }
        }

        // Sort children by createdAt for deterministic layout
        for (const [key, list] of childrenOf.entries()) {
            list.sort((a: any, b: any) => new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime());
            childrenOf.set(key, list);
        }

        // Root image (the one with id === currentRootId or the actual root in the set)
        const rootId = currentRootId.value;
        const root = images.find(i => i.id === rootId) || images.find(i => !i.parentId) || images[0];
        if (!root) return [];

        const laneById = new Map<string, number>();

        function assignLanes(node: Image, lane: number) {
            laneById.set(node.id, lane);
            const children = childrenOf.get(node.id) || [];
            if (!children.length) return;
            // First child continues on same lane
            assignLanes(children[0] as Image, lane);
            // Subsequent children branch to new lanes incrementally
            let nextLane = lane + 1;
            for (const child of children.slice(1)) {
                assignLanes(child, nextLane);
                nextLane += 1;
            }
        }

        assignLanes(root, 0);

        // Build output in chronological order to preserve existing rendering order
        const ordered = images.sort((a: any, b: any) => new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime());
        const result: TreeItem[] = [];
        const lastByLane = new Map<number, number>(); // index in result
        const laneIndices = new Map<number, number[]>();
        for (const img of ordered) {
            const lane = laneById.get(img.id) ?? 0;
            const parentLane = img.parentId ? (laneById.get(img.parentId) ?? null) : null;
            const siblings = img.parentId ? (childrenOf.get(img.parentId) || []) : [];
            const hasMultipleChildren = (childrenOf.get(img.id) || []).length > 1;
            const hasPrevOnLane = lastByLane.has(lane);
            const item: TreeItem = {
                image: img,
                lane,
                parentLane,
                isSplitFromParent: parentLane !== null && parentLane !== lane,
                hasMultipleChildren,
                hasPrevOnLane,
                hasNextOnLane: false,
            };
            result.push(item);
            lastByLane.set(lane, result.length - 1);
            const list = laneIndices.get(lane) || [];
            list.push(result.length - 1);
            laneIndices.set(lane, list);
        }

        // Mark hasNextOnLane by looking ahead in laneIndices
        for (const [lane, indices] of laneIndices.entries()) {
            for (let i = 0; i < indices.length; i++) {
                const idx = indices[i] as number;
                const hasNext = i < indices.length - 1;
                if (hasNext) {
                    result[idx]!.hasNextOnLane = true;
                }
            }
        }

        return result;
    });

    function setSelectedBranchId(id: string | null | 'ALL') {
        selectedBranchId.value = id;
    }

    return {
        currentRootId,
        timelineImages,
        branches,
        selectedBranchId,
        setSelectedBranchId,
        versionsForSelectedBranch,
        treeItems,
    };
}
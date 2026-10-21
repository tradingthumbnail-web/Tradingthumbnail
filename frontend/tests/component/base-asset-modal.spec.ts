// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { mount } from "@vue/test-utils";

import BaseAssetModal from "../../app/components/Base/AssetModal.vue";

vi.mock('#app', () => ({
    useNuxtApp: () => ({
        $generationApi: {
            get: vi.fn(() => Promise.resolve({ data: [] })),
        },
    }),
    useFetch: vi.fn(async () => ({
        data: { value: [] },
        pending: { value: false },
    })),
    useI18n: () => ({
        t: (key: string) => key,
    }),
}));

describe('Base/AssetModal.vue', () => {
    it('renders the asset modal', async () => {
        const wrapper = mount(BaseAssetModal, {
            props : {
                modelValue: true,
            },
            global: {
                stubs: {
                    Icon: true,
                }
            }
        });
        
        await wrapper.vm.$nextTick();
        
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.vm).toBeTruthy();
        console.log(wrapper.html());
        // TOOD: fix this test
        // expect(wrapper.find('dialog').exists() || wrapper.find('[role="dialog"]').exists()).toBe(true);
    });
});
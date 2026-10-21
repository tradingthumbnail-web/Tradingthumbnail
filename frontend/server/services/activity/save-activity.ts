import { db } from "~~/server/database"
import { activityTable, type TargetType } from "~~/server/database/schemas/activity.schema";
import { type EventType } from "~~/shared/event-types";

interface RecordedActivity {
    projectId?: string;
    userId: string;
    targetType: TargetType;
    targetId: string;
    eventType: EventType;
    payload: Record<string, any>;
}

/**
 * Saves an activity to the database. This way we can keep track of what generated what and with which parameters and stuff.
 * @param activity - The activity to save
 * @returns Void
 */
export const saveActivity = async (activity: RecordedActivity) => {
    try {
        await db.insert(activityTable).values({
            projectId: activity.projectId ? activity.projectId : null,
            userId: activity.userId,
            targetType: activity.targetType,
            targetId: activity.targetId,
            eventType: activity.eventType,
            payload: activity.payload,
        });
    } catch (error) {
        console.error("-x- Error saving activity", error);
        return null;
    }
};
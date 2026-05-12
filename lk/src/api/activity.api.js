import {
  ACTIVITY_EVENTS,
  ACTIVITY_SUMMARY,
} from '../data/activity.data.js';

export async function getActivityOverview() {
  return {
    summary: ACTIVITY_SUMMARY,
    events: ACTIVITY_EVENTS,
  };
}

export async function getActivityEvents() {
  return ACTIVITY_EVENTS;
}

export async function getActivitySummary() {
  return ACTIVITY_SUMMARY;
}
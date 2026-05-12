import { DASHBOARD_OVERVIEW } from '../data/dashboard.data';

export async function getDashboardOverview() {
  return DASHBOARD_OVERVIEW;
}

export async function getRecentActivity() {
  return DASHBOARD_OVERVIEW.recentActivity;
}

export async function getContinueListening() {
  return DASHBOARD_OVERVIEW.continueListening;
}

export async function getDashboardStats() {
  return DASHBOARD_OVERVIEW.stats;
}

export async function getDashboardAiInsights() {
  return DASHBOARD_OVERVIEW.aiInsights;
}
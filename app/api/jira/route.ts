import { NextResponse } from 'next/server';

// Hardcoded Jira credentials
const JIRA_DOMAIN = '';
const JIRA_EMAIL = '';
const JIRA_API_TOKEN = '';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  // Get maxResults from query parameter, default to 50
  const { searchParams } = new URL(request.url);
  const maxResults = parseInt(searchParams.get('maxResults') || '50', 10);
  const limit = Math.min(Math.max(maxResults, 1), 100); // Clamp between 1 and 100

  try {
    // Try multiple JQL approaches
    let data: any = null;
    let response: Response;

    // First, try with sprint filter and currentUser()
    let jql = `sprint in openSprints() AND assignee = currentUser() ORDER BY updated DESC`;
    let encodedJql = encodeURIComponent(jql);
    let apiUrl = `https://${JIRA_DOMAIN}/rest/api/3/search/jql?jql=${encodedJql}&maxResults=${limit}&fields=summary,status,priority,assignee,updated,issuetype`;

    response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      data = await response.json();
    } else {
      // If first query failed, try fallback queries
      if (response.status === 401) {
        throw new Error('Jira authentication failed. Please check your credentials.');
      }
      if (response.status === 403) {
        throw new Error('Jira access forbidden. Please check your API token permissions.');
      }
      if (response.status === 404) {
        throw new Error(`Jira domain not found. Please check your JIRA_DOMAIN: ${JIRA_DOMAIN}`);
      }
      console.log('Jira API - First query failed, will try fallback queries');
    }

    // If first query failed or no results, try different approaches
    if (!data || !data.issues || data.issues.length === 0) {
      // Try without sprint filter
      const noSprintJql = `assignee = currentUser() ORDER BY updated DESC`;
      const noSprintEncoded = encodeURIComponent(noSprintJql);
      const noSprintUrl = `https://${JIRA_DOMAIN}/rest/api/3/search/jql?jql=${noSprintEncoded}&maxResults=${limit}&fields=summary,status,priority,assignee,updated,issuetype`;

      response = await fetch(noSprintUrl, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        data = await response.json();
      }

      // If still no results, try with email instead of currentUser()
      if (!data || !data.issues || data.issues.length === 0) {
        const emailJql = `sprint in openSprints() AND assignee = "${JIRA_EMAIL}" ORDER BY updated DESC`;
        const emailEncoded = encodeURIComponent(emailJql);
        const emailUrl = `https://${JIRA_DOMAIN}/rest/api/3/search/jql?jql=${emailEncoded}&maxResults=${limit}&fields=summary,status,priority,assignee,updated,issuetype`;

        response = await fetch(emailUrl, {
          method: 'GET',
          headers: {
            Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          data = await response.json();
        }

        // Last fallback: email without sprint filter
        if (!data || !data.issues || data.issues.length === 0) {
          const emailNoSprintJql = `assignee = "${JIRA_EMAIL}" ORDER BY updated DESC`;
          const emailNoSprintEncoded = encodeURIComponent(emailNoSprintJql);
          const emailNoSprintUrl = `https://${JIRA_DOMAIN}/rest/api/3/search/jql?jql=${emailNoSprintEncoded}&maxResults=${limit}&fields=summary,status,priority,assignee,updated,issuetype`;

          response = await fetch(emailNoSprintUrl, {
            method: 'GET',
            headers: {
              Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
              Accept: 'application/json',
            },
          });

          if (response.ok) {
            data = await response.json();
          }
        }
      }
    }

    // Handle case where issues might be undefined or empty
    if (!data || !data.issues || !Array.isArray(data.issues)) {
      return NextResponse.json({ tasks: [] });
    }

    const tasks = data.issues.map((issue: any) => ({
      id: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      priority: issue.fields.priority?.name || 'Unknown',
      type: issue.fields.issuetype?.name || 'Task',
      updated: issue.fields.updated,
      url: `https://${JIRA_DOMAIN}/browse/${issue.key}`,
    }));

    // Sort tasks: In Progress first, then To Do, then Done
    const getStatusOrder = (status: string): number => {
      const lower = status.toLowerCase();
      if (lower.includes('progress') || lower.includes('in progress')) {
        return 1; // In Progress - highest priority
      }
      if (lower.includes('to do') || lower.includes('todo') || lower.includes('open')) {
        return 2; // To Do - second priority
      }
      if (lower.includes('done') || lower.includes('closed') || lower.includes('resolved')) {
        return 3; // Done - lowest priority
      }
      return 4; // Other statuses - last
    };

    const sortedTasks = tasks.sort((a: { status: string; updated: string }, b: { status: string; updated: string }) => {
      const orderA = getStatusOrder(a.status);
      const orderB = getStatusOrder(b.status);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // If same status, sort by updated date (most recent first)
      return new Date(b.updated).getTime() - new Date(a.updated).getTime();
    });

    return NextResponse.json({ tasks: sortedTasks });
  } catch (error: any) {
    console.error('Jira API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Jira tasks' },
      { status: 500 }
    );
  }
}

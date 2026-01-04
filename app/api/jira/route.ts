import { NextResponse } from 'next/server';

const JIRA_DOMAIN = process.env.JIRA_DOMAIN;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

export async function GET(request: Request) {
  if (!JIRA_DOMAIN || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    return NextResponse.json(
      { error: 'Jira credentials not configured. Please set JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN in your environment variables.' },
      { status: 500 }
    );
  }

  // Get maxResults from query parameter, default to 50
  const { searchParams } = new URL(request.url);
  const maxResults = parseInt(searchParams.get('maxResults') || '50', 10);
  const limit = Math.min(Math.max(maxResults, 1), 100); // Clamp between 1 and 100

  // Log environment check (without exposing sensitive data)
  console.log('Jira API - Environment check:', {
    hasDomain: !!JIRA_DOMAIN,
    hasEmail: !!JIRA_EMAIL,
    hasToken: !!JIRA_API_TOKEN,
    domain: JIRA_DOMAIN ? `${JIRA_DOMAIN.substring(0, 5)}...` : 'missing',
  });

  try {
    // Fetch tasks from current active sprint assigned to the user
    const jql = encodeURIComponent(
      'sprint in openSprints() AND assignee = currentUser() ORDER BY updated DESC'
    );

    // Use the new /rest/api/3/search/jql endpoint (migrated from /rest/api/3/search)
    const response = await fetch(
      `https://${JIRA_DOMAIN}/rest/api/3/search/jql?jql=${jql}&maxResults=${limit}&fields=summary,status,priority,assignee,updated,issuetype`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jira API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 500), // Limit error text length
        url: `https://${JIRA_DOMAIN}/rest/api/3/search/jql`,
      });
      
      // Provide more helpful error messages
      if (response.status === 401) {
        throw new Error('Jira authentication failed. Please check your JIRA_EMAIL and JIRA_API_TOKEN.');
      }
      if (response.status === 403) {
        throw new Error('Jira access forbidden. Please check your API token permissions.');
      }
      if (response.status === 404) {
        throw new Error(`Jira domain not found. Please check your JIRA_DOMAIN: ${JIRA_DOMAIN}`);
      }
      throw new Error(`Jira API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

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


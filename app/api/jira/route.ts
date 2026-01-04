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
    // Try multiple JQL approaches - currentUser() might work, but email might be needed
    // Try currentUser() first (works in some Jira setups)
    let jql = `sprint in openSprints() AND assignee = currentUser() ORDER BY updated DESC`;
    let encodedJql = encodeURIComponent(jql);

    console.log('Jira API - Trying query with currentUser():', {
      jql: jql,
      maxResults: limit,
    });

    // Use the /rest/api/3/search/jql endpoint (original working endpoint)
    let apiUrl = `https://${JIRA_DOMAIN}/rest/api/3/search/jql?jql=${encodedJql}&maxResults=${limit}&fields=summary,status,priority,assignee,updated,issuetype`;
    
    let response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        Accept: 'application/json',
      },
    });

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

    let data = await response.json();

    // Log response for debugging
    console.log('Jira API - Response (currentUser):', {
      total: data.total || 0,
      issuesCount: data.issues?.length || 0,
      hasIssues: !!data.issues,
    });

    // If no results with currentUser(), try with email directly
    if (!data.issues || data.issues.length === 0) {
      console.log('Jira API - No results with currentUser(), trying with email...');
      
      // Extract username from email (part before @) as fallback
      const username = JIRA_EMAIL.split('@')[0];
      const emailJql = `sprint in openSprints() AND assignee = "${JIRA_EMAIL}" ORDER BY updated DESC`;
      const usernameJql = `sprint in openSprints() AND assignee = "${username}" ORDER BY updated DESC`;
      
      // Try email first
      let fallbackJql = emailJql;
      let fallbackEncoded = encodeURIComponent(fallbackJql);
      let fallbackUrl = `https://${JIRA_DOMAIN}/rest/api/3/search/jql?jql=${fallbackEncoded}&maxResults=${limit}&fields=summary,status,priority,assignee,updated,issuetype`;
      
      console.log('Jira API - Trying fallback with email:', { jql: fallbackJql });
      
      response = await fetch(fallbackUrl, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        data = await response.json();
        console.log('Jira API - Response (email):', {
          total: data.total || 0,
          issuesCount: data.issues?.length || 0,
        });
        
        // If still no results, try username
        if (!data.issues || data.issues.length === 0) {
          console.log('Jira API - No results with email, trying username...');
          fallbackJql = usernameJql;
          fallbackEncoded = encodeURIComponent(fallbackJql);
          fallbackUrl = `https://${JIRA_DOMAIN}/rest/api/3/search/jql?jql=${fallbackEncoded}&maxResults=${limit}&fields=summary,status,priority,assignee,updated,issuetype`;
          
          response = await fetch(fallbackUrl, {
            method: 'GET',
            headers: {
              Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
              Accept: 'application/json',
            },
          });
          
          if (response.ok) {
            data = await response.json();
            console.log('Jira API - Response (username):', {
              total: data.total || 0,
              issuesCount: data.issues?.length || 0,
            });
          } else {
            console.warn('Jira API - Username fallback failed:', response.status);
          }
        }
      } else {
        console.warn('Jira API - Email fallback failed:', response.status);
      }
    }

    // Handle case where issues might be undefined or empty
    if (!data.issues || !Array.isArray(data.issues)) {
      console.warn('Jira API - No issues in response after all attempts:', {
        dataKeys: Object.keys(data),
        responseStructure: JSON.stringify(data).substring(0, 200),
      });
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


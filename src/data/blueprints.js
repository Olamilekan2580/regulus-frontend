// src/data/blueprints.js

// In the future, you will import your raw JSON files here like this:
// import onboardingData from './json/onboarding.json';

export const blueprints = [
  {
    id: 'wf-001',
    category: 'Operations',
    title: 'Client Intake to Asana & Slack',
    description: 'Triggers when a new client submits the Regulus portal form. Creates a project in Asana and pings the team in Slack.',
    tools: ['Webhook', 'Asana', 'Slack'],
    payload: `{"nodes":[{"parameters":{"path":"regulus-intake","options":{}},"name":"Webhook","type":"n8n-nodes-base.webhook","typeVersion":1,"position":[250,300]},{"parameters":{"text":"New Client Intake Received!","channel":"#sales"},"name":"Slack","type":"n8n-nodes-base.slack","typeVersion":1,"position":[450,300]}]}`
  },
  {
    id: 'wf-002',
    category: 'Finance',
    title: 'Stripe Invoice to QuickBooks',
    description: 'Listens for a Stripe webhook via Regulus and automatically generates a paid receipt record in QuickBooks Online.',
    tools: ['Stripe', 'QuickBooks'],
    payload: `{"nodes":[{"parameters":{"path":"invoice-paid","options":{}},"name":"Webhook","type":"n8n-nodes-base.webhook","typeVersion":1,"position":[250,300]},{"parameters":{"resource":"invoice","operation":"create"},"name":"QuickBooks","type":"n8n-nodes-base.quickbooks","typeVersion":1,"position":[450,300]}]}`
  },
  {
    id: 'wf-003',
    category: 'Client Success',
    title: 'Milestone Completion Email',
    description: 'When you mark a project milestone as "Complete", automatically send a branded status update email to the client via SendGrid.',
    tools: ['Webhook', 'SendGrid'],
    payload: `{"nodes":[{"parameters":{"path":"milestone-complete","options":{}},"name":"Webhook","type":"n8n-nodes-base.webhook","typeVersion":1,"position":[250,300]},{"parameters":{"fromEmail":"updates@agency.com","toEmail":"={{$json.body.client_email}}","subject":"Project Update"},"name":"SendGrid","type":"n8n-nodes-base.sendGrid","typeVersion":1,"position":[450,300]}]}`
  }
];
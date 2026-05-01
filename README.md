# Journey Builder React

A visual journey builder built with React and TypeScript that lets you view and configure form workflows with prefill mappings between forms.

## What this does

This app connects to a mock backend server and displays a visual graph of forms that are part of a workflow. Each form can have prerequisites (other forms that need to be completed before it), and you can set up prefill mappings so that fields from earlier forms automatically fill in fields in later forms.

The main things you can do in this app:

1. View all the forms in a workflow as a visual graph where you can see how they connect to each other
2. Click on any form node to open a side panel
3. In that side panel you can view existing prefill mappings, add new ones, or delete ones you don't want

## Tech stack

React 19, TypeScript, Vite, React Flow for the graph visualization, and Axios for HTTP requests.

## How to run it

You need to run two things at the same time. First clone and start the mock server, then clone and start this app.

Step 1 - Clone this repo and install dependencies:

```
git clone https://github.com/VivekJariwala50/Journey-Builder-React.git
cd Journey-Builder-React
npm install
```

Step 2 - Clone and start the mock API server (in a separate terminal):

```
git clone https://github.com/mosaic-avantos/frontendchallengeserver.git
cd frontendchallengeserver
npm install
npm start
```

The mock server will run on http://localhost:3000. This is the official backend server provided as part of the coding challenge.

Step 3 - Go back to the first terminal and start this app:

```
npm run dev
```

Then open http://localhost:5173 in your browser.

## How it works

When you open the app it calls the API endpoint at /api/v1/{tenant_id}/actions/blueprints/{blueprint_id}/graph to get the graph data. The graph data includes all the form nodes, the edges between them, and the form field definitions.

The graph is displayed using React Flow. You can zoom in and out, pan around, and there is a minimap in the bottom right corner.

When you click a form node, a panel slides in from the right side. This panel has two tabs:

Current Mappings tab shows you all the prefill mappings that are already set up for that form. Each mapping shows which field in the current form gets prefilled and where the value comes from. You can delete any mapping by clicking the trash icon.

Add Mapping tab lets you create a new prefill mapping. You pick which field in the current form you want to prefill, then pick which upstream form to pull the value from, then pick which field from that upstream form to use as the source. The app only shows you forms that come before the current form in the workflow so you cannot accidentally create circular dependencies.

## Project structure

```
src/
  api/          API service functions
  components/   React components
    FormNode/       The custom node that renders in the graph
    JourneyBuilder/ The main layout and data fetching
    PrefillPanel/   The side panel for viewing and editing mappings
  hooks/        Custom React hooks
  types/        TypeScript type definitions
```

## What I focused on

I wanted to make sure the prefill mapping feature was solid because that is the core of the challenge. The graph traversal logic to find all ancestor nodes (not just direct parents) took some thought to get right. I used a BFS approach to walk up the graph from any selected node to find all its ancestors.

The state management is kept local to the JourneyBuilder component and flows down as props. Updates to mappings update both the React Flow nodes and the graph state so everything stays in sync.

The UI uses a light theme built around a rose and teal color palette. I paid attention to details like smooth transitions when the panel opens, hover states on all interactive elements, empty state messaging, and making the graph background look nice with the dot pattern.

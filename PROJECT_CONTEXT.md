# Global Human Signal

## Project Concept

Global Human Signal is a minimalist global interface where people record what is happening in their city right now.

The goal is to create a distributed real-time record of human reality.

Users write short signals describing events or observations from their local environment.

Examples of signals:

- "Tokyo subway line delayed."
- "Heavy snow starting in Helsinki."
- "Power outage in downtown Buenos Aires."
- "Crowds gathering near parliament building."

Each message represents a **human signal**.

Signals together form a global flow of real-time information.

---

## Interface Philosophy

The interface should be extremely minimal.

Design principles:

- Dark interface
- Simple typography
- Focus on information, not decoration
- No heavy UI elements
- Text-first experience

The system should feel like a **global terminal of reality**.

---

## Homepage Idea

Main screen should contain:

- Title: **Global Human Signal**
- Subtitle: Distributed Record of Reality
- Status line: System online

Below that:

An input box:

"Record what is happening in your city right now..."

Users type short signals.

Signals appear in a global stream.

---

## Signal Structure

Each signal should include:

- City
- Country
- Time
- Message

Example:

Tokyo 🇯🇵  
"Subway line delayed due to equipment failure."

---

## Event Aggregation Logic

Multiple signals describing the same event should merge.

Example:

"Tokyo subway delay"  
and  
"Metro line stopped"

should be grouped into a single event.

Higher-level events override smaller ones.

Example:

"Tokyo Metro disruption" overrides individual line delays.

---

## Interaction Rules

Clicking a signal should **expand it inline**.

No full page reload.

Expanded view shows:

- More signals from same event
- Locations
- Timeline

---

## Visual Style

The design should feel like:

- a command terminal
- a global monitoring system
- a quiet observation interface

Minimal colors.

Mostly:

- black
- white
- subtle accent color

---

## Development Goal

The current project starts as a simple HTML page.

AI is allowed to:

- restructure HTML
- create CSS files
- create JavaScript files
- improve UI structure

The goal is to evolve the page into a simple but powerful interface for recording global human signals.

# Additional Project Context (Expanded Description)


# Global Human Signal

## Core Idea

Global Human Signal is a minimal global interface where people record what is happening in their city right now.

The goal is to build a distributed real-time record of reality through human observations.

Each message is called a **signal**.

Signals are short descriptions of real-world events happening in a specific place at a specific moment.

Example signals:

Tokyo — subway line delay  
Helsinki — heavy snow beginning  
Buenos Aires — power outage downtown  
Paris — large protest forming  

Signals together form a **global stream of human perception**.

---

# Interface Philosophy

The interface should be extremely minimal and calm.

Design principles:

- dark interface
- text-first experience
- minimal visual noise
- no complex menus
- focus on information

The site should feel like:

a **global monitoring terminal of human reality**

Not a social network.

More like a **distributed observation system**.

---

# Homepage Structure

Homepage should contain:

Title:

GLOBAL HUMAN SIGNAL

Subtitle:

Distributed Record of Reality

Status line:

System online

Below that:

Input box:

"Record what is happening in your city right now..."

Users type short signals.

Signals appear in a real-time global stream.

---

# Signal Format

Each signal should contain:

City  
Country  
Timestamp  
Message text  

Example:

Tokyo 🇯🇵  
"Subway line delayed due to equipment failure."

Berlin 🇩🇪  
"Crowd gathering near parliament."

---

# Signal Stream

Signals appear in chronological order.

Newest signals appear first.

Each signal shows:

City  
Country flag  
Time  
Short message

Clicking a signal should expand it inline.

No page reload.

Expanded view may show:

- related signals
- event timeline
- nearby locations

---

# Event Aggregation

Signals describing the same situation should merge into a higher level event.

Example:

"Tokyo subway delay"  
"Metro line stopped"

→ become

"Tokyo Metro disruption"

Higher-level events override smaller ones.

Example hierarchy:

Tokyo Metro disruption  
→ Line 3 delay  
→ Station closure

The system prefers **larger contextual events**.

---

# AI Aggregation Logic

When multiple signals describe the same situation:

1. Detect similar events
2. Merge into larger event
3. Keep timeline of signals

Example:

Signal A  
Signal B  
Signal C

→ aggregated into Event X

Signals remain visible as evidence.

---

# Visual Style

The design should feel like:

- a terminal
- a monitoring interface
- a quiet observation system

Color palette:

black background  
white text  
very subtle accent color

Typography should be simple and readable.

---

# Interaction Rules

Users do not create accounts initially.

Signals are anonymous observations.

Interface must stay simple:

type → submit → appear in stream.

No complicated profile systems.

---

# Future Possibilities

Possible future features:

- map view of signals
- city filters
- event clustering
- global timeline

But the core interface must stay simple.

---

# Development Instruction

The current project begins as a single HTML page.

AI is allowed to:

- restructure the HTML
- create CSS files
- create JavaScript files
- improve layout
- implement signal stream logic
- implement input interface

The goal is to transform the page into a minimal working prototype of the Global Human Signal system.
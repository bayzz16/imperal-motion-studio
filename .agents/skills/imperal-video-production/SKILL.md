---
name: imperal-video-production
description: Production workflow for multi-project Remotion videos in IMPERAL Motion Studio.
---

# IMPERAL Video Production Skill

Treat this repository as a reusable production engine, not unrelated one-off compositions.

## System-wide standards
- Prefer shared, typed, deterministic components for motion, camera, lighting, scene transitions, typography, audio, and reusable subjects.
- Keep project story, copy, assets, and art direction isolated from shared engine code.
- Make animation frame-driven and deterministic. Avoid wall-clock time and unseeded randomness.
- Validate public component inputs and add regression tests for shared helpers.
- Add heavyweight dependencies only when their rendering benefit is measured.

## Visual standards
- Build depth with layered lighting, atmospheric perspective, highlights, shadows, texture, parallax, and controlled camera movement.
- Use object-specific motion: axial spin, orbital movement, environmental drift, and secondary animation.
- Preserve visual continuity. Avoid static icons when a subject should visibly move.
- Keep labels readable on mobile and maintain safe margins for vertical and horizontal formats.

## Audio standards
- Keep narration, music, ambience, and effects on separate tracks.
- Measure generated narration duration and derive cue positions from actual files.
- Duck music under speech, fade transitions, and avoid clipping.
- Use original or properly licensed assets and record provenance.
- Validate every generated file before rendering.

## Automated quality gates
- Install dependencies with the lockfile when present.
- Run TypeScript validation, unit tests, and Remotion composition discovery.
- Validate IDs, frame rate, dimensions, duration, and referenced asset paths.
- Render the requested composition and inspect the MP4 with FFprobe.
- Extract contact sheets and listen to representative audio sections where possible.
- A successful CI render is not the same as human creative review.

## Architecture
- src/projects: independent compositions and metadata.
- src/motion: reusable frame-driven motion and camera mathematics.
- src/visual: reusable visual subjects and scene primitives.
- src/timeline: timeline planning and sequencing.
- src/voice: voice metadata and prepared dialogue tracks.
- scripts: deterministic asset generation, validation, and QA.
- .github/workflows: CI validation, rendering, and artifact upload.

## Mandatory reference-first visual development

**Do not start drawing, modeling, or animating a requested subject until its visual identity has been understood.** This gate applies to every new composition and every materially new subject in an existing composition.

### 1. Parse the request
- Identify the exact subject, species/type/variant where relevant, setting, time period, intended style, action, camera view, and target aspect ratios.
- Separate required facts from artistic choices. If the requested subject is ambiguous in a way that changes its appearance, ask one concise clarification instead of silently choosing.
- For educational/scientific content, identify the facts that must remain accurate.

### 2. Research visual references
- Gather multiple relevant references before production. Prefer primary, educational, museum, botanical, scientific, manufacturer, or other domain-authoritative sources for factual subjects; use high-quality photographic or observational references for visual detail.
- Inspect the actual reference images when available. Do not claim to have inspected an image based only on its title, caption, or search snippet.
- Study the whole subject and its important parts: silhouette, proportions, anatomy/structure, color variation, surface/material, texture, attachment points, and how parts relate in 3D.
- For motion, research how the subject moves: joints, deformation, timing, weight, wind response, growth stages, and secondary motion as relevant.
- Record source URLs, source type, what each source verifies, and any uncertainty in a compact reference sheet.
- References guide observation; do not copy a single artist's composition, distinctive style, copyrighted character, or protected asset. Create an original synthesis and use assets only when licensed or otherwise permitted.

### 3. Create a subject visual specification
Before animation, write a concise visual specification containing:
- canonical subject/type and recognizable silhouette;
- required structural details and proportions;
- color/material/lighting notes;
- details that must not be simplified away;
- motion behavior and physical constraints;
- camera/framing requirements for each requested aspect ratio;
- source links and confidence/uncertainty notes.

For example, a flower specification should identify the flower type first, then its petal count/arrangement and shape, central reproductive structure where visible, stem, leaves, leaf attachment, natural color variation, and how petals/stem respond to movement. Do not substitute a generic circle of petals for a specific flower.

### 4. Build and review before final animation
- Create a still keyframe, silhouette, or low-cost animatic first. Check it against the reference sheet before adding complex motion, lighting, particles, or effects.
- Preserve subject identity across shots, camera angles, lighting changes, and aspect-ratio variants.
- Use layered geometry, connected silhouettes, believable overlap, and object-specific detail; avoid disconnected placeholder shapes when they misrepresent the subject.
- Animate only plausible motion. Keep frame-driven deterministic timing.
- Review representative close, medium, and wide frames. Compare silhouette, structure, proportions, color, and motion against the references; correct visible mismatches before final render.
- For educational subjects, verify labels, measurements, and explanatory diagrams independently of artistic appearance.

### 5. Reference-first quality gate
A project is not ready for final rendering until:
- the request has been interpreted correctly;
- the reference sheet and provenance notes exist;
- the subject specification covers its defining details;
- a keyframe/animatic has passed a visual comparison;
- animation does not break the subject's anatomy or identity;
- source and licensing notes are recorded.

If browsing, image inspection, or reference access is unavailable, state that limitation and request suitable references or proceed only with an explicitly labeled provisional design. Never fabricate research, source URLs, or image inspection.


## Mandatory causal and physical continuity gate

Every meaningful action or scientific claim in narration must have a visible cause, process, and consequence in the animation. Do not use narration as a substitute for showing the process.

Before animating, build a cause-and-effect table for key beats: cause/precondition, visible process, result, and narration cue. Ensure the cause appears before the effect.

For example, if narration says a seed absorbs water, establish a plausible moisture source or condition (rain, irrigation, or already-moist soil), show moisture entering the soil and reaching the seed, then show the seed swelling before the radicle emerges. Rain is one possible source, not a universal requirement. Germination also depends on suitable moisture, oxygen, and temperature. Do not imply sunlight is required by every species for germination; show light as important for the emerging seedling's later photosynthetic growth.

Reject sequences where an object changes without a visible or established cause, narration describes an action absent from the frame, an effect appears before its cause, physical continuity breaks between shots, or audio timing contradicts the visuals.

Apply this gate to educational, scientific, procedural, and story-driven animations. Record the sequence in the storyboard/reference sheet and verify it in rendered frames.

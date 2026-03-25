# Razel Studio: Finish Pro - Execution Plan

- [x] **Step 1: Base Application Shell & Unity Integration**
  - Create [index.html](file:///e:/Work/HTML/RichwavesDemo/index.html), [index.css](file:///e:/Work/HTML/RichwavesDemo/index.css), and [app.js](file:///e:/Work/HTML/RichwavesDemo/app.js) in `RichwavesDemo`.
  - Add mobile viewport lock `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">` to [index.html](file:///e:/Work/HTML/RichwavesDemo/index.html).
  - Design UI layout placeholders: Left Sidebar (Catalog), Right Sidebar (Inspector), Center View (Unity iframe), and Instructions Modal.
  - Create a branded 'Razel Studio' loading overlay with a CSS shimmer/pulse animation for the progress bar (stays active until Unity initializes).

- [x] **Step 2: Arch-viz Styling & Responsiveness**
  - Implement a narrow floating Catalog strip (~80px) with circular icons, `blur(20px)` backdrops, and CSS right-side tooltips.
  - Implement a sleek floating Inspector panel (top-right) with customized SaaS-style sliders (gold tracks, white knobs).
  - Integrate 'Fraunces' typography for headings and 'Inter' for data.
  - Add micro-animations (scale on hover, slide-in from left/right on load).
  - Transform vertical strip into a horizontal bottom drawer for touch devices (<1024px) with minimum 60x60px touch icons.

- [x] **Step 3: JSON Driven Catalog Generation**
  - Parse [DemoCatalog.json](file:///e:/Work/HTML/RichwavesDemo/DemoCatalog.json).
  - Dynamically generate the Catalog UI using the `products` array.
  - Load and assign texture preview images utilizing paths pointing to `StreamingAssets/TexturedPaints/`.
  - Use CSS skeleton-loading states for Catalog icons while previews are fetching.

- [x] **Step 4: Inspector & Business Logic UI**
  - Implement dynamic Right Sidebar (Inspector) population based on Catalog selection.
  - Generate tint selection UI from `shadePalette`.
  - Generate pricing info UI displaying the 3-tier `variants` (SKU and dynamically calculated cost/coverage).

- [ ] **Step 5: UI to Unity Communication Setup**
  - Wire up Catalog texture and Color tint selections to transmit parameters to Unity.
  - Implement a standardized pipe-delimited string protocol payload (`SlotIndex|TextureFolder|HexColor|Smoothness|Metallic`) for a single-frame update without flickering.
  - Display a 'Processing Finish...' HTML overlay with a rotating icon animation when a texture is selected, dismissing when Unity confirms.

- [ ] **Step 6: Unity to UI Two-Way Selection Logic**
  - Setup JavaScript listener functions for Unity to invoke upon a wall click.
  - Make the UI "focus" and unlock the right inspector with properties belonging to the clicked wall.

- [ ] **Step 7: Branded 4K Screenshot Export Engine**
  - Trigger Unity to perform a high-res "Render-to-Texture" and send a Base64 string/Blob back to JavaScript.
  - In JavaScript, receive the Base64 high-res image and overlay branded graphics, selected product SKU, and contextual details.
  - Implement download functionality for the final combined image.

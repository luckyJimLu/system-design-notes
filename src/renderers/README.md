# Renderer Registry

The registry is the extension boundary between imported content and the
React WebUI. A semantic block renderer can be added without editing the
navigation, search, route, or document shell components:

```ts
const plugin: RendererPlugin = {
  name: 'callout',
  version: '1.0.0',
  register(registry) {
    registry.registerBlock('callout', CalloutBlock);
  },
};
```

Only explicitly registered blocks should be rendered. Unknown blocks must
fall back to plain text or a diagnostic; imported content must never execute
arbitrary JSX or JavaScript.

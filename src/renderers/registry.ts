import type { ComponentType, ReactNode } from 'react';
import { CalloutBlock } from './CalloutBlock';

export interface BlockProps {
  name: string;
  attributes: Record<string, string>;
  children: ReactNode;
}

export type BlockRenderer = ComponentType<BlockProps>;

export interface RendererPlugin {
  name: string;
  version: string;
  register(registry: RendererRegistry): void;
}

/** Stable extension point for semantic Markdown blocks. */
export class RendererRegistry {
  private readonly blocks = new Map<string, BlockRenderer>();

  registerBlock(name: string, renderer: BlockRenderer): void {
    if (!name.trim()) throw new Error('Renderer block name cannot be empty');
    this.blocks.set(name.trim().toLowerCase(), renderer);
  }

  getBlock(name: string): BlockRenderer | undefined {
    return this.blocks.get(name.trim().toLowerCase());
  }

  hasBlock(name: string): boolean {
    return Boolean(this.getBlock(name));
  }
}

export function createRendererRegistry(plugins: RendererPlugin[] = []): RendererRegistry {
  const registry = new RendererRegistry();
  for (const plugin of plugins) plugin.register(registry);
  return registry;
}

/** Built-in semantic blocks available to Markdown content. */
export const builtinRendererRegistry = createRendererRegistry([
  {
    name: 'builtin-callout',
    version: '1.0.0',
    register(registry) {
      registry.registerBlock('callout', CalloutBlock);
    },
  },
]);

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { clicklabPageTitle } from '~~/shared/clicklab/page-title';

const PROJECT_ROOT = resolve(process.cwd());

function readProjectFile(relativePath: string): string {
  return readFileSync(resolve(PROJECT_ROOT, relativePath), 'utf8');
}

describe('clicklab page title helper', () => {
  it('formats titles with product suffix', () => {
    expect(clicklabPageTitle('Sketch')).toBe('Sketch | ClickLab');
    expect(clicklabPageTitle('Image to Image')).toBe('Image to Image | ClickLab');
  });

  it('tool pages import the title helper when they use clicklabPageTitle', () => {
    const pagePaths = [
      'app/pages/(tools)/sketch.vue',
      'app/pages/(tools)/image-to-image.vue',
      'app/pages/(tools)/photoshoot.vue',
    ];

    for (const path of pagePaths) {
      const source = readProjectFile(path);
      expect(source).toContain("import { clicklabPageTitle } from '~~/shared/clicklab/page-title';");
      expect(source).toContain('useHead({ title: clicklabPageTitle(');
    }
  });
});

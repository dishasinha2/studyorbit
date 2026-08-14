import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectUploadedFileIntent } from '../../src/lib/ai/retrieval';

const cases = [
  { input: 'summarise my uploaded file', expect: true },
  { input: 'explain my PDF', expect: true },
  { input: 'tell me what i have to do in MiRAI Capstone Projects & Rubric pdf that i uploaded', expect: true, expectToken: 'mirai' },
  { input: 'what does the document I uploaded say?', expect: true },
  { input: 'give me the requirements from the PDF I uploaded', expect: true },
  { input: 'explain paging from my uploaded OS notes', expect: true, expectToken: 'paging' },
];

describe('detectUploadedFileIntent', () => {
  for (const c of cases) {
    it(c.input, () => {
      const out = detectUploadedFileIntent(c.input);
      assert.equal(out.isUploadedQuery, c.expect, `expected isUploadedQuery ${c.expect} for: ${c.input}`);
      if (c.expectToken) {
        const tokens = out.filenameTokens.join(' ');
        assert(tokens.toLowerCase().includes(c.expectToken.toLowerCase()), `expected token ${c.expectToken} in ${tokens}`);
      }
    });
  }
});

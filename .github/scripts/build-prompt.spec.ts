import { vol } from 'memfs';
import { join } from 'path';
import {
  substituteVariables,
  readSectionFile,
  processSection,
  buildPrompt,
  validateOverridePath,
  generateUniqueDelimiter,
  deriveSectionTagName,
  wrapSectionWithTags,
  hasActiveDiscussion,
  restructureCommentsIntoThreads,
  processExistingCommentsJson,
  FIXED_SECTIONS_EARLY,
  FIXED_SECTIONS_LATE,
  FIXED_SECTIONS_FINAL,
  OVERRIDABLE_SECTIONS,
  CONDITIONAL_SECTIONS,
  CRITICAL_SECTIONS,
  type TemplateVariables,
  type PromptBuildOptions,
  type RawComment,
  type CommentReply,
  type ThreadedComment,
} from './build-prompt';

// Mock fs module with memfs
jest.mock('fs', () => {
  const memfs = jest.requireActual('memfs');
  return memfs.fs;
});

// Mock process.cwd() to return a consistent path for testing
const MOCK_CWD = '/repo';

describe('Build Prompt Script', () => {
  const mockPromptDir = '/repo/test/prompts/pr-review';

  // Standard template variables for testing
  const mockVariables: TemplateVariables = {
    REPO_OWNER: 'Uniswap',
    REPO_NAME: 'ai-toolkit',
    PR_NUMBER: '123',
    BASE_REF: 'main',
    PATCH_ID: 'abc123def456',
    MERGE_BASE: 'def456abc123',
    LINES_CHANGED: '50',
    CHANGED_FILES: 'src/foo.ts\nsrc/bar.ts',
    PR_DIFF: '@@ -1,3 +1,5 @@\n+const foo = "bar";',
    EXISTING_COMMENTS_JSON: '[]',
  };

  beforeEach(() => {
    // Mock process.cwd() to return consistent path for testing
    jest.spyOn(process, 'cwd').mockReturnValue(MOCK_CWD);

    // Reset virtual filesystem
    vol.reset();

    // Create mock repository root directory
    vol.mkdirSync(MOCK_CWD, { recursive: true });

    // Create mock directory structure
    vol.mkdirSync(join(mockPromptDir, 'fixed'), { recursive: true });
    vol.mkdirSync(join(mockPromptDir, 'overridable'), { recursive: true });
  });

  afterEach(() => {
    vol.reset();
    // Restore original process.cwd
    jest.restoreAllMocks();
  });

  describe('substituteVariables', () => {
    it('should substitute ${VAR} syntax', () => {
      const content = 'Repository: ${REPO_OWNER}/${REPO_NAME}';
      const result = substituteVariables(content, mockVariables);
      expect(result).toBe('Repository: Uniswap/ai-toolkit');
    });

    it('should substitute multiple variables', () => {
      const content = 'PR #${PR_NUMBER} targeting ${BASE_REF}';
      const result = substituteVariables(content, mockVariables);
      expect(result).toBe('PR #123 targeting main');
    });

    it('should handle multiline content', () => {
      const content = `# Context
Owner: \${REPO_OWNER}
Name: \${REPO_NAME}
PR: \${PR_NUMBER}`;
      const result = substituteVariables(content, mockVariables);
      expect(result).toContain('Owner: Uniswap');
      expect(result).toContain('Name: ai-toolkit');
      expect(result).toContain('PR: 123');
    });

    it('should leave unknown variables unchanged', () => {
      const content = 'Value: ${UNKNOWN_VAR}';
      const result = substituteVariables(content, mockVariables);
      // Unknown variables are preserved (safer than replacing with empty string)
      expect(result).toBe('Value: ${UNKNOWN_VAR}');
    });

    it('should not substitute partial matches', () => {
      const content = 'REPO_OWNER_EXTRA is not ${REPO_OWNER}';
      const result = substituteVariables(content, mockVariables);
      expect(result).toBe('REPO_OWNER_EXTRA is not Uniswap');
    });

    it('should handle content with no variables', () => {
      const content = 'Static content without variables';
      const result = substituteVariables(content, mockVariables);
      expect(result).toBe('Static content without variables');
    });

    it('should preserve content around substitutions', () => {
      const content = '**Repository:** ${REPO_OWNER}/${REPO_NAME}\n---';
      const result = substituteVariables(content, mockVariables);
      expect(result).toBe('**Repository:** Uniswap/ai-toolkit\n---');
    });
  });

  describe('readSectionFile', () => {
    it('should read existing file content', () => {
      const filePath = join(mockPromptDir, 'fixed', 'test.md');
      vol.writeFileSync(filePath, '# Test Content');

      const content = readSectionFile(filePath);
      expect(content).toBe('# Test Content');
    });

    it('should return null for non-existent file', () => {
      const content = readSectionFile('/non/existent/file.md');
      expect(content).toBeNull();
    });

    it('should handle empty files', () => {
      const filePath = join(mockPromptDir, 'fixed', 'empty.md');
      vol.writeFileSync(filePath, '');

      const content = readSectionFile(filePath);
      expect(content).toBe('');
    });
  });

  describe('processSection', () => {
    it('should read and substitute variables in section', () => {
      const filePath = join(mockPromptDir, 'fixed', 'test.md');
      vol.writeFileSync(filePath, '# PR ${PR_NUMBER} Review');

      const { content, error } = processSection(filePath, mockVariables);
      expect(error).toBeNull();
      expect(content).toBe('# PR 123 Review');
    });

    it('should return error for missing file', () => {
      const { content, error } = processSection('/non/existent.md', mockVariables);
      expect(content).toBeNull();
      expect(error).toContain('Section file not found');
    });
  });

  describe('buildPrompt', () => {
    // Helper to create mock section files
    const createSectionFiles = () => {
      // Fixed early sections (1-3)
      FIXED_SECTIONS_EARLY.forEach((file, index) => {
        vol.writeFileSync(
          join(mockPromptDir, 'fixed', file),
          `# Section ${index + 1}\nOwner: \${REPO_OWNER}\n`
        );
      });

      // Overridable sections (4-12)
      OVERRIDABLE_SECTIONS.forEach(({ file }, index) => {
        vol.writeFileSync(
          join(mockPromptDir, 'overridable', file),
          `# Overridable Section ${index + 4}\nDefault content\n`
        );
      });

      // Fixed late sections (13-15)
      FIXED_SECTIONS_LATE.forEach((file, index) => {
        vol.writeFileSync(
          join(mockPromptDir, 'fixed', file),
          `# Section ${index + 13}\nLate fixed content\n`
        );
      });

      // Conditional sections (16-18)
      vol.writeFileSync(
        join(mockPromptDir, 'overridable', CONDITIONAL_SECTIONS.reReviewProcess),
        '# Re-Review Process\nAdditional steps for re-reviews.\n'
      );
      vol.writeFileSync(
        join(mockPromptDir, 'fixed', CONDITIONAL_SECTIONS.existingComments),
        '# Existing Comments\n${EXISTING_COMMENTS_JSON}\n'
      );
      vol.writeFileSync(
        join(mockPromptDir, 'fixed', CONDITIONAL_SECTIONS.fastReviewMode),
        '# Fast Review Mode\nThis is a trivial PR.\n'
      );

      // Final sections (19)
      FIXED_SECTIONS_FINAL.forEach((file, index) => {
        vol.writeFileSync(
          join(mockPromptDir, 'fixed', file),
          `# Final Section ${index + 19}\nFinal content\n`
        );
      });
    };

    it('should build prompt with all fixed sections', () => {
      createSectionFiles();

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        existingCommentCount: 0,
        isTrivial: false,
      };

      const result = buildPrompt(options);

      // Should include early fixed sections (1-3)
      FIXED_SECTIONS_EARLY.forEach((file) => {
        expect(result.sectionsIncluded).toContain(file);
      });

      // Should include overridable sections (4-12)
      OVERRIDABLE_SECTIONS.forEach(({ file }) => {
        expect(result.sectionsIncluded).toContain(file);
      });

      // Should include late fixed sections (13-15)
      FIXED_SECTIONS_LATE.forEach((file) => {
        expect(result.sectionsIncluded).toContain(file);
      });

      // Should include final sections (19)
      FIXED_SECTIONS_FINAL.forEach((file) => {
        expect(result.sectionsIncluded).toContain(file);
      });

      // Should NOT include conditional sections when conditions not met
      expect(result.sectionsIncluded).not.toContain(CONDITIONAL_SECTIONS.reReviewProcess);
      expect(result.sectionsIncluded).not.toContain(CONDITIONAL_SECTIONS.existingComments);
      expect(result.sectionsIncluded).not.toContain(CONDITIONAL_SECTIONS.fastReviewMode);
    });

    it('should include existing comments section when existingCommentCount > 0', () => {
      createSectionFiles();

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        existingCommentCount: 5,
        isTrivial: false,
      };

      const result = buildPrompt(options);
      expect(result.sectionsIncluded).toContain(CONDITIONAL_SECTIONS.existingComments);
      expect(result.prompt).toContain('# Existing Comments');
    });

    it('should include re-review process section when existingCommentCount > 0', () => {
      createSectionFiles();

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        existingCommentCount: 5,
        isTrivial: false,
      };

      const result = buildPrompt(options);
      expect(result.sectionsIncluded).toContain(CONDITIONAL_SECTIONS.reReviewProcess);
      expect(result.prompt).toContain('# Re-Review Process');
    });

    it('should NOT include re-review process section when existingCommentCount is 0', () => {
      createSectionFiles();

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        existingCommentCount: 0,
        isTrivial: false,
      };

      const result = buildPrompt(options);
      expect(result.sectionsIncluded).not.toContain(CONDITIONAL_SECTIONS.reReviewProcess);
    });

    it('should include fast review mode section when isTrivial is true', () => {
      createSectionFiles();

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        existingCommentCount: 0,
        isTrivial: true,
      };

      const result = buildPrompt(options);
      expect(result.sectionsIncluded).toContain(CONDITIONAL_SECTIONS.fastReviewMode);
      expect(result.prompt).toContain('# Fast Review Mode');
    });

    it('should include all conditional sections when both conditions met', () => {
      createSectionFiles();

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        existingCommentCount: 3,
        isTrivial: true,
      };

      const result = buildPrompt(options);
      expect(result.sectionsIncluded).toContain(CONDITIONAL_SECTIONS.reReviewProcess);
      expect(result.sectionsIncluded).toContain(CONDITIONAL_SECTIONS.existingComments);
      expect(result.sectionsIncluded).toContain(CONDITIONAL_SECTIONS.fastReviewMode);
    });

    it('should substitute variables in final prompt', () => {
      createSectionFiles();

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        existingCommentCount: 0,
        isTrivial: false,
      };

      const result = buildPrompt(options);
      expect(result.prompt).toContain('Owner: Uniswap');
      expect(result.prompt).not.toContain('${REPO_OWNER}');
    });

    it('should wrap sections with HTML comment tags', () => {
      createSectionFiles();

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        existingCommentCount: 0,
        isTrivial: false,
      };

      const result = buildPrompt(options);

      // Check for start/end tags for sections
      expect(result.prompt).toContain('<!-- pr-review-review-context-start -->');
      expect(result.prompt).toContain('<!-- pr-review-review-context-end -->');
      expect(result.prompt).toContain('<!-- pr-review-review-priorities-start -->');
      expect(result.prompt).toContain('<!-- pr-review-review-priorities-end -->');
      expect(result.prompt).toContain('<!-- pr-review-output-guidance-start -->');
      expect(result.prompt).toContain('<!-- pr-review-output-guidance-end -->');
    });

    it('should use override file when provided and exists', () => {
      createSectionFiles();

      // Create an override file using relative path from MOCK_CWD
      const overrideRelativePath = 'custom/overrides/review-priorities.md';
      const overrideAbsolutePath = join(MOCK_CWD, overrideRelativePath);
      vol.mkdirSync(join(MOCK_CWD, 'custom/overrides'), { recursive: true });
      vol.writeFileSync(
        overrideAbsolutePath,
        '# Custom Review Priorities\nFocus on security first.\n'
      );

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        overrides: {
          reviewPriorities: overrideRelativePath, // Use relative path
        },
        existingCommentCount: 0,
        isTrivial: false,
      };

      const result = buildPrompt(options);
      expect(result.prompt).toContain('# Custom Review Priorities');
      expect(result.prompt).toContain('Focus on security first.');
      expect(result.overridesApplied).toContain('reviewPriorities');
    });

    it('should fall back to default when override file does not exist', () => {
      createSectionFiles();

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        overrides: {
          reviewPriorities: '/non/existent/override.md',
        },
        existingCommentCount: 0,
        isTrivial: false,
      };

      const result = buildPrompt(options);
      expect(result.prompt).toContain('# Overridable Section 4');
      expect(result.prompt).toContain('Default content');
      expect(result.overridesApplied).not.toContain('reviewPriorities');
    });

    it('should apply multiple overrides', () => {
      createSectionFiles();

      // Create override files using relative paths from MOCK_CWD
      vol.mkdirSync(join(MOCK_CWD, 'custom/overrides'), { recursive: true });
      vol.writeFileSync(join(MOCK_CWD, 'custom/overrides/priorities.md'), '# Custom Priorities\n');
      vol.writeFileSync(join(MOCK_CWD, 'custom/overrides/skip.md'), '# Custom Skip\n');

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        overrides: {
          reviewPriorities: 'custom/overrides/priorities.md', // Relative paths
          filesToSkip: 'custom/overrides/skip.md',
        },
        existingCommentCount: 0,
        isTrivial: false,
      };

      const result = buildPrompt(options);
      expect(result.prompt).toContain('# Custom Priorities');
      expect(result.prompt).toContain('# Custom Skip');
      expect(result.overridesApplied).toHaveLength(2);
      expect(result.overridesApplied).toContain('reviewPriorities');
      expect(result.overridesApplied).toContain('filesToSkip');
    });

    it('should apply new overrides (verdict sections, avoid patterns)', () => {
      createSectionFiles();

      // Create override files for new sections
      vol.mkdirSync(join(MOCK_CWD, 'custom/overrides'), { recursive: true });
      vol.writeFileSync(
        join(MOCK_CWD, 'custom/overrides/verdict-approve.md'),
        '# Custom Approve Criteria\nCustom approval rules.\n'
      );
      vol.writeFileSync(
        join(MOCK_CWD, 'custom/overrides/avoid-patterns.md'),
        '# Custom Avoid Patterns\nDo not do X.\n'
      );

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        overrides: {
          verdictApprove: 'custom/overrides/verdict-approve.md',
          avoidPatterns: 'custom/overrides/avoid-patterns.md',
        },
        existingCommentCount: 0,
        isTrivial: false,
      };

      const result = buildPrompt(options);
      expect(result.prompt).toContain('# Custom Approve Criteria');
      expect(result.prompt).toContain('Custom approval rules.');
      expect(result.prompt).toContain('# Custom Avoid Patterns');
      expect(result.prompt).toContain('Do not do X.');
      expect(result.overridesApplied).toContain('verdictApprove');
      expect(result.overridesApplied).toContain('avoidPatterns');
    });

    it('should apply re-review process override when existingCommentCount > 0', () => {
      createSectionFiles();

      // Create override file for re-review process
      vol.mkdirSync(join(MOCK_CWD, 'custom/overrides'), { recursive: true });
      vol.writeFileSync(
        join(MOCK_CWD, 'custom/overrides/re-review.md'),
        '# Custom Re-Review Process\nCustom re-review steps.\n'
      );

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        overrides: {
          reReviewProcess: 'custom/overrides/re-review.md',
        },
        existingCommentCount: 5, // Required for re-review section to be included
        isTrivial: false,
      };

      const result = buildPrompt(options);
      expect(result.prompt).toContain('# Custom Re-Review Process');
      expect(result.prompt).toContain('Custom re-review steps.');
      expect(result.overridesApplied).toContain('reReviewProcess');
    });

    it('should report errors for missing section files', () => {
      // Don't create any section files
      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        existingCommentCount: 0,
        isTrivial: false,
      };

      const result = buildPrompt(options);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('not found'))).toBe(true);
    });

    it('should maintain correct section order', () => {
      createSectionFiles();

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        existingCommentCount: 5,
        isTrivial: true,
      };

      const result = buildPrompt(options);

      // Check sections are in expected order
      const expectedOrder = [
        ...FIXED_SECTIONS_EARLY,
        ...OVERRIDABLE_SECTIONS.map(({ file }) => file),
        ...FIXED_SECTIONS_LATE,
        CONDITIONAL_SECTIONS.reReviewProcess,
        CONDITIONAL_SECTIONS.existingComments,
        CONDITIONAL_SECTIONS.fastReviewMode,
        ...FIXED_SECTIONS_FINAL,
      ];

      // Verify order by checking positions in sectionsIncluded array
      let lastIndex = -1;
      for (const section of expectedOrder) {
        const currentIndex = result.sectionsIncluded.indexOf(section);
        if (currentIndex !== -1) {
          expect(currentIndex).toBeGreaterThan(lastIndex);
          lastIndex = currentIndex;
        }
      }
    });

    it('should handle empty variables gracefully', () => {
      createSectionFiles();

      const emptyVariables: TemplateVariables = {
        REPO_OWNER: '',
        REPO_NAME: '',
        PR_NUMBER: '',
        BASE_REF: '',
        PATCH_ID: '',
        MERGE_BASE: '',
        LINES_CHANGED: '',
        CHANGED_FILES: '',
        PR_DIFF: '',
        EXISTING_COMMENTS_JSON: '',
      };

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: emptyVariables,
        existingCommentCount: 0,
        isTrivial: false,
      };

      // Should not throw
      const result = buildPrompt(options);
      expect(result.errors.length).toBe(0);
      expect(result.sectionsIncluded.length).toBeGreaterThan(0);
    });
  });

  describe('Section Constants', () => {
    it('should have correct number of early fixed sections', () => {
      expect(FIXED_SECTIONS_EARLY).toHaveLength(3);
    });

    it('should have correct number of overridable sections', () => {
      // 4 original + 5 new (initial review process, avoid patterns, 3 verdicts) + re-review process
      expect(OVERRIDABLE_SECTIONS).toHaveLength(9);
    });

    it('should have correct number of late fixed sections', () => {
      expect(FIXED_SECTIONS_LATE).toHaveLength(3);
    });

    it('should have correct number of final fixed sections', () => {
      expect(FIXED_SECTIONS_FINAL).toHaveLength(1);
    });

    it('should have overridable sections with correct keys', () => {
      const keys = OVERRIDABLE_SECTIONS.map((s) => s.overrideKey);
      expect(keys).toContain('reviewPriorities');
      expect(keys).toContain('filesToSkip');
      expect(keys).toContain('communicationStyle');
      expect(keys).toContain('patternRecognition');
      expect(keys).toContain('initialReviewProcess');
      expect(keys).toContain('avoidPatterns');
      expect(keys).toContain('verdictApprove');
      expect(keys).toContain('verdictRequestChanges');
      expect(keys).toContain('verdictComment');
    });

    it('should have conditional sections defined', () => {
      expect(CONDITIONAL_SECTIONS.reReviewProcess).toBe('16-re-review-process.md');
      expect(CONDITIONAL_SECTIONS.existingComments).toBe('17-existing-comments.md');
      expect(CONDITIONAL_SECTIONS.fastReviewMode).toBe('18-fast-review-mode.md');
    });

    it('should have critical sections defined', () => {
      expect(CRITICAL_SECTIONS).toContain('10-verdict-approve.md');
      expect(CRITICAL_SECTIONS).toContain('11-verdict-request-changes.md');
      expect(CRITICAL_SECTIONS).toContain('12-verdict-comment.md');
      expect(CRITICAL_SECTIONS).toContain('19-output-guidance.md');
    });
  });

  describe('Tag Utilities', () => {
    describe('deriveSectionTagName', () => {
      it('should strip numeric prefix and extension', () => {
        expect(deriveSectionTagName('1-review-context.md')).toBe('review-context');
      });

      it('should handle two-digit prefixes', () => {
        expect(deriveSectionTagName('12-verdict-comment.md')).toBe('verdict-comment');
        expect(deriveSectionTagName('19-output-guidance.md')).toBe('output-guidance');
      });

      it('should handle single-digit prefixes', () => {
        expect(deriveSectionTagName('8-initial-review-process.md')).toBe('initial-review-process');
      });

      it('should handle hyphenated section names', () => {
        expect(deriveSectionTagName('16-re-review-process.md')).toBe('re-review-process');
      });
    });

    describe('wrapSectionWithTags', () => {
      it('should wrap content with start and end tags', () => {
        const result = wrapSectionWithTags('# Content', 'review-context');
        expect(result).toBe(
          '<!-- pr-review-review-context-start -->\n# Content\n<!-- pr-review-review-context-end -->'
        );
      });

      it('should handle multiline content', () => {
        const content = '# Section\n\nParagraph 1\n\nParagraph 2';
        const result = wrapSectionWithTags(content, 'test-section');
        expect(result).toContain('<!-- pr-review-test-section-start -->');
        expect(result).toContain(content);
        expect(result).toContain('<!-- pr-review-test-section-end -->');
      });
    });
  });

  describe('Security: validateOverridePath', () => {
    it('should accept empty paths', () => {
      const result = validateOverridePath('');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should accept valid relative paths', () => {
      const result = validateOverridePath('.claude/prompts/review.md', '/repo');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should accept nested relative paths', () => {
      const result = validateOverridePath('src/prompts/custom/review.md', '/repo');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject absolute paths', () => {
      const result = validateOverridePath('/etc/passwd', '/repo');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Absolute paths not allowed');
    });

    it('should reject path traversal with ../', () => {
      const result = validateOverridePath('../../../etc/passwd', '/repo');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });

    it('should reject path traversal in middle of path', () => {
      const result = validateOverridePath('foo/../../../etc/passwd', '/repo');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });

    it('should reject path traversal with Windows-style absolute paths', () => {
      // On Unix systems, C: prefix is not treated as absolute, but we should still catch traversal
      const result = validateOverridePath('/C:/Windows/System32/config', '/repo');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Absolute paths not allowed');
    });
  });

  describe('Security: generateUniqueDelimiter', () => {
    it('should generate a string starting with PROMPT_DELIMITER_', () => {
      const delimiter = generateUniqueDelimiter();
      expect(delimiter).toMatch(/^PROMPT_DELIMITER_/);
    });

    it('should generate unique delimiters on each call', () => {
      const delimiter1 = generateUniqueDelimiter();
      const delimiter2 = generateUniqueDelimiter();
      expect(delimiter1).not.toBe(delimiter2);
    });

    it('should include timestamp and random component', () => {
      const delimiter = generateUniqueDelimiter();
      // Format: PROMPT_DELIMITER_{timestamp}_{randomHex}
      expect(delimiter).toMatch(/^PROMPT_DELIMITER_\d+_[a-f0-9]+$/);
    });
  });

  describe('Security: Template Substitution Safety', () => {
    it('should NOT recursively substitute variables containing template syntax', () => {
      // If PR_DIFF contains ${REPO_OWNER}, it should NOT be substituted
      const maliciousVariables: TemplateVariables = {
        ...mockVariables,
        PR_DIFF: 'Injected content: ${REPO_OWNER} should remain literal',
      };

      const content = 'The diff is: ${PR_DIFF}';
      const result = substituteVariables(content, maliciousVariables);

      // The ${REPO_OWNER} inside PR_DIFF should remain as literal text
      expect(result).toBe('The diff is: Injected content: ${REPO_OWNER} should remain literal');
      // It should NOT become: "The diff is: Injected content: Uniswap should remain literal"
    });

    it('should handle variables containing other variable names without substitution', () => {
      const variablesWithNesting: TemplateVariables = {
        ...mockVariables,
        CHANGED_FILES: 'file_with_${PR_NUMBER}_in_name.ts',
      };

      const content = 'Files: ${CHANGED_FILES}';
      const result = substituteVariables(content, variablesWithNesting);

      // The ${PR_NUMBER} in CHANGED_FILES should remain literal
      expect(result).toBe('Files: file_with_${PR_NUMBER}_in_name.ts');
    });

    it('should handle diff content with template-like syntax', () => {
      const variablesWithCodeDiff: TemplateVariables = {
        ...mockVariables,
        PR_DIFF: `+const config = {
+  owner: '\${REPO_OWNER}',
+  name: '\${REPO_NAME}'
+};`,
      };

      const content = 'Diff:\n${PR_DIFF}';
      const result = substituteVariables(content, variablesWithCodeDiff);

      // Template syntax in the diff should NOT be substituted
      expect(result).toContain("owner: '${REPO_OWNER}'");
      expect(result).toContain("name: '${REPO_NAME}'");
    });
  });

  describe('Security: Critical Section Validation', () => {
    it('should report error when critical sections are missing', () => {
      // Create only early fixed and late fixed sections, but skip overridable verdict sections
      FIXED_SECTIONS_EARLY.forEach((file, index) => {
        vol.writeFileSync(join(mockPromptDir, 'fixed', file), `# Section ${index + 1}\n`);
      });

      // Create only some overridable sections (skip verdict sections which are critical)
      OVERRIDABLE_SECTIONS.filter(
        ({ overrideKey }) =>
          !['verdictApprove', 'verdictRequestChanges', 'verdictComment'].includes(overrideKey)
      ).forEach(({ file }) => {
        vol.writeFileSync(join(mockPromptDir, 'overridable', file), '# Overridable\n');
      });

      FIXED_SECTIONS_LATE.forEach((file) => {
        vol.writeFileSync(join(mockPromptDir, 'fixed', file), '# Late\n');
      });

      // Intentionally NOT creating critical sections (verdict files and final output)

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        existingCommentCount: 0,
        isTrivial: false,
      };

      const result = buildPrompt(options);

      // Should have CRITICAL errors for verdict sections (10, 11, 12) and output guidance (19)
      expect(result.errors.some((e) => e.startsWith('CRITICAL:'))).toBe(true);
      expect(result.errors.some((e) => e.includes('10-verdict-approve.md'))).toBe(true);
      expect(result.errors.some((e) => e.includes('11-verdict-request-changes.md'))).toBe(true);
      expect(result.errors.some((e) => e.includes('12-verdict-comment.md'))).toBe(true);
      expect(result.errors.some((e) => e.includes('19-output-guidance.md'))).toBe(true);
    });

    it('should reject path traversal in override paths', () => {
      // Create all section files
      FIXED_SECTIONS_EARLY.forEach((file, index) => {
        vol.writeFileSync(join(mockPromptDir, 'fixed', file), `# Section ${index + 1}\n`);
      });

      OVERRIDABLE_SECTIONS.forEach(({ file }) => {
        vol.writeFileSync(join(mockPromptDir, 'overridable', file), '# Default\n');
      });

      FIXED_SECTIONS_LATE.forEach((file) => {
        vol.writeFileSync(join(mockPromptDir, 'fixed', file), '# Late\n');
      });

      FIXED_SECTIONS_FINAL.forEach((file) => {
        vol.writeFileSync(join(mockPromptDir, 'fixed', file), '# Final\n');
      });

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        overrides: {
          reviewPriorities: '../../../etc/passwd',
        },
        existingCommentCount: 0,
        isTrivial: false,
      };

      const result = buildPrompt(options);

      // Should have path traversal error
      expect(result.errors.some((e) => e.includes('Path traversal detected'))).toBe(true);
      // Should NOT have applied the malicious override
      expect(result.overridesApplied).not.toContain('reviewPriorities');
    });

    it('should reject absolute paths in override paths', () => {
      // Create all section files
      FIXED_SECTIONS_EARLY.forEach((file, index) => {
        vol.writeFileSync(join(mockPromptDir, 'fixed', file), `# Section ${index + 1}\n`);
      });

      OVERRIDABLE_SECTIONS.forEach(({ file }) => {
        vol.writeFileSync(join(mockPromptDir, 'overridable', file), '# Default\n');
      });

      FIXED_SECTIONS_LATE.forEach((file) => {
        vol.writeFileSync(join(mockPromptDir, 'fixed', file), '# Late\n');
      });

      FIXED_SECTIONS_FINAL.forEach((file) => {
        vol.writeFileSync(join(mockPromptDir, 'fixed', file), '# Final\n');
      });

      const options: PromptBuildOptions = {
        promptDir: mockPromptDir,
        variables: mockVariables,
        overrides: {
          filesToSkip: '/etc/passwd',
        },
        existingCommentCount: 0,
        isTrivial: false,
      };

      const result = buildPrompt(options);

      // Should have absolute path error
      expect(result.errors.some((e) => e.includes('Absolute paths not allowed'))).toBe(true);
      // Should NOT have applied the malicious override
      expect(result.overridesApplied).not.toContain('filesToSkip');
    });
  });

  describe('Thread Restructuring', () => {
    describe('hasActiveDiscussion', () => {
      it('should return false for no replies', () => {
        const replies: CommentReply[] = [];
        expect(hasActiveDiscussion(replies, 'reviewer1')).toBe(false);
      });

      it('should return false for single reply from original commenter', () => {
        const replies: CommentReply[] = [{ id: 101, body: 'Follow-up note', user: 'reviewer1' }];
        expect(hasActiveDiscussion(replies, 'reviewer1')).toBe(false);
      });

      it('should return true for single reply from different user', () => {
        const replies: CommentReply[] = [
          { id: 101, body: 'What approach do you suggest?', user: 'author' },
        ];
        expect(hasActiveDiscussion(replies, 'reviewer1')).toBe(true);
      });

      it('should return true for 2+ replies regardless of users', () => {
        const replies: CommentReply[] = [
          { id: 101, body: 'Reply 1', user: 'reviewer1' },
          { id: 102, body: 'Reply 2', user: 'reviewer1' },
        ];
        expect(hasActiveDiscussion(replies, 'reviewer1')).toBe(true);
      });

      it('should return true for back-and-forth discussion', () => {
        const replies: CommentReply[] = [
          { id: 101, body: 'What approach?', user: 'author' },
          { id: 102, body: 'Try factory pattern', user: 'reviewer1' },
          { id: 103, body: 'Let me think about it', user: 'author' },
        ];
        expect(hasActiveDiscussion(replies, 'reviewer1')).toBe(true);
      });
    });

    describe('restructureCommentsIntoThreads', () => {
      it('should handle empty comment list', () => {
        const rawComments: RawComment[] = [];
        const result = restructureCommentsIntoThreads(rawComments);
        expect(result).toEqual([]);
      });

      it('should convert single root comment with no replies', () => {
        const rawComments: RawComment[] = [
          {
            id: 100,
            path: 'src/foo.ts',
            line: 42,
            body: 'This needs refactoring',
            user: 'reviewer1',
            in_reply_to_id: null,
          },
        ];

        const result = restructureCommentsIntoThreads(rawComments);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          id: 100,
          path: 'src/foo.ts',
          line: 42,
          body: 'This needs refactoring',
          user: 'reviewer1',
          reply_count: 0,
          has_active_discussion: false,
          replies: [],
        });
      });

      it('should group replies with their parent comment', () => {
        const rawComments: RawComment[] = [
          {
            id: 100,
            path: 'src/foo.ts',
            line: 42,
            body: 'This needs refactoring',
            user: 'reviewer1',
            in_reply_to_id: null,
          },
          {
            id: 101,
            path: 'src/foo.ts',
            line: 42,
            body: 'What approach?',
            user: 'author',
            in_reply_to_id: 100,
          },
          {
            id: 102,
            path: 'src/foo.ts',
            line: 42,
            body: 'Try factory pattern',
            user: 'reviewer1',
            in_reply_to_id: 100,
          },
        ];

        const result = restructureCommentsIntoThreads(rawComments);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(100);
        expect(result[0].reply_count).toBe(2);
        expect(result[0].has_active_discussion).toBe(true);
        expect(result[0].replies).toHaveLength(2);
        expect(result[0].replies[0]).toEqual({
          id: 101,
          body: 'What approach?',
          user: 'author',
        });
        expect(result[0].replies[1]).toEqual({
          id: 102,
          body: 'Try factory pattern',
          user: 'reviewer1',
        });
      });

      it('should handle multiple threads', () => {
        const rawComments: RawComment[] = [
          {
            id: 100,
            path: 'src/foo.ts',
            line: 42,
            body: 'Thread 1 comment',
            user: 'reviewer1',
            in_reply_to_id: null,
          },
          {
            id: 200,
            path: 'src/bar.ts',
            line: 15,
            body: 'Thread 2 comment',
            user: 'reviewer2',
            in_reply_to_id: null,
          },
          {
            id: 101,
            path: 'src/foo.ts',
            line: 42,
            body: 'Reply to thread 1',
            user: 'author',
            in_reply_to_id: 100,
          },
        ];

        const result = restructureCommentsIntoThreads(rawComments);

        expect(result).toHaveLength(2);

        // Thread 1: has a reply from different user -> active discussion
        const thread1 = result.find((t) => t.id === 100);
        expect(thread1).toBeDefined();
        expect(thread1!.reply_count).toBe(1);
        expect(thread1!.has_active_discussion).toBe(true);

        // Thread 2: no replies -> no active discussion
        const thread2 = result.find((t) => t.id === 200);
        expect(thread2).toBeDefined();
        expect(thread2!.reply_count).toBe(0);
        expect(thread2!.has_active_discussion).toBe(false);
      });

      it('should mark thread with self-reply as not active', () => {
        const rawComments: RawComment[] = [
          {
            id: 100,
            path: 'src/foo.ts',
            line: 42,
            body: 'Original comment',
            user: 'reviewer1',
            in_reply_to_id: null,
          },
          {
            id: 101,
            path: 'src/foo.ts',
            line: 42,
            body: 'Actually, never mind',
            user: 'reviewer1',
            in_reply_to_id: 100,
          },
        ];

        const result = restructureCommentsIntoThreads(rawComments);

        expect(result).toHaveLength(1);
        expect(result[0].reply_count).toBe(1);
        // Single reply from same user = not active discussion
        expect(result[0].has_active_discussion).toBe(false);
      });
    });

    describe('processExistingCommentsJson', () => {
      it('should return empty array for empty string', () => {
        expect(processExistingCommentsJson('')).toBe('[]');
      });

      it('should return empty array for whitespace', () => {
        expect(processExistingCommentsJson('   ')).toBe('[]');
      });

      it('should return empty array for empty JSON array', () => {
        expect(processExistingCommentsJson('[]')).toBe('[]');
      });

      it('should process and restructure valid JSON', () => {
        const input = JSON.stringify([
          {
            id: 100,
            path: 'src/foo.ts',
            line: 42,
            body: 'Comment',
            user: 'reviewer1',
            in_reply_to_id: null,
          },
        ]);

        const result = processExistingCommentsJson(input);
        const parsed = JSON.parse(result);

        expect(parsed).toHaveLength(1);
        expect(parsed[0].id).toBe(100);
        expect(parsed[0].reply_count).toBe(0);
        expect(parsed[0].has_active_discussion).toBe(false);
        expect(parsed[0].replies).toEqual([]);
      });

      it('should handle invalid JSON by returning original', () => {
        const invalidJson = '{ invalid json }';
        const result = processExistingCommentsJson(invalidJson);
        expect(result).toBe(invalidJson);
      });

      it('should preserve full thread structure in output', () => {
        const input = JSON.stringify([
          {
            id: 100,
            path: 'src/foo.ts',
            line: 42,
            body: 'Root comment',
            user: 'reviewer1',
            in_reply_to_id: null,
          },
          {
            id: 101,
            path: 'src/foo.ts',
            line: 42,
            body: 'Reply 1',
            user: 'author',
            in_reply_to_id: 100,
          },
          {
            id: 102,
            path: 'src/foo.ts',
            line: 42,
            body: 'Reply 2',
            user: 'reviewer1',
            in_reply_to_id: 100,
          },
        ]);

        const result = processExistingCommentsJson(input);
        const parsed: ThreadedComment[] = JSON.parse(result);

        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toMatchObject({
          id: 100,
          path: 'src/foo.ts',
          line: 42,
          body: 'Root comment',
          user: 'reviewer1',
          reply_count: 2,
          has_active_discussion: true,
        });
        expect(parsed[0].replies).toHaveLength(2);
      });
    });
  });
});

/**
 * Tests for metadata utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generateReelMetadata,
  estimateReelSize,
  formatBytes,
  generateFilename,
} from '../../core/metadata';
import type { Reel, Frame } from '../../types';

describe('metadata', () => {
  const mockFrame: Frame = {
    id: 'frame-1',
    reelId: 'reel-123',
    image: 'data:image/png;base64,iVBORw0KGgo=',
    timestamp: Date.now(),
    order: 0,
    metadata: {
      viewportCoords: { x: 100, y: 200 },
      relativeCoords: { x: 50, y: 150 },
      elementPath: '#button',
      buttonType: 0,
      viewportSize: { width: 1920, height: 1080 },
      scrollPosition: { x: 0, y: 0 },
      captureType: 'pre-click',
    },
  };

  const mockReel: Reel = {
    id: 'reel-123',
    title: 'Test Recording',
    description: 'A test recording',
    startTime: Date.now() - 5000,
    endTime: Date.now(),
    frames: [mockFrame],
    settings: {
      markerSize: 50,
      markerColor: '#ff0000',
      exportFormat: 'gif',
      postClickDelay: 500,
      postClickInterval: 100,
      maxCaptureDuration: 4000,
      scale: 2,
      obfuscationEnabled: false,
    },
    metadata: {
      userAgent: 'test',
      duration: 5000,
      clickCount: 1,
      viewportSize: { width: 1920, height: 1080 },
    },
  };

  describe('generateReelMetadata', () => {
    it('should generate metadata with duration', () => {
      const metadata = generateReelMetadata(mockReel);

      expect(metadata.duration).toBeGreaterThan(0);
      expect(metadata.userAgent).toBeDefined();
    });

    it('should count pre-click frames as clicks', () => {
      const metadata = generateReelMetadata(mockReel);

      expect(metadata.clickCount).toBe(1);
    });

    it('should include viewport size from first frame', () => {
      const metadata = generateReelMetadata(mockReel);

      expect(metadata.viewportSize).toEqual({ width: 1920, height: 1080 });
    });
  });

  describe('estimateReelSize', () => {
    it('should estimate size from data URLs', () => {
      const size = estimateReelSize([mockFrame]);

      expect(size).toBeGreaterThan(0);
    });

    it('should handle blob frames', () => {
      const blobFrame: Frame = {
        ...mockFrame,
        image: new Blob(['test'], { type: 'image/png' }),
      };

      const size = estimateReelSize([blobFrame]);

      expect(size).toBe(4); // 'test' is 4 bytes
    });
  });

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with title and timestamp', () => {
      const filename = generateFilename(mockReel, 'gif');

      expect(filename).toContain('test-recording');
      expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(filename.endsWith('.gif')).toBe(true);
    });

    it('should sanitize title for filename', () => {
      const reel = {
        ...mockReel,
        title: 'Test Recording!@#$%',
      };
      const filename = generateFilename(reel, 'gif');

      expect(filename).toContain('test-recording');
      expect(filename).not.toContain('!');
      expect(filename).not.toContain('@');
    });

    it('should use "recording" as fallback for empty title', () => {
      const reel = {
        ...mockReel,
        title: '',
      };
      const filename = generateFilename(reel, 'gif');

      expect(filename).toContain('recording');
    });
  });
});

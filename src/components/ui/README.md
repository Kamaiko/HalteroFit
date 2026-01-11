# UI Components - Generic Reusables

**Purpose:** Production-ready, generic UI components with optimized defaults and comprehensive error handling.

**Phase:** 0.5.4 (Infrastructure preparation for Phase 1-5)

**Philosophy:** Simple, library-agnostic interfaces with sophisticated internals.

---

## Quick Reference

```typescript
import { CachedImage } from '@/components/ui';

// Basic usage
<CachedImage
  source={{ uri: 'https://example.com/image.png' }}
  contentFit="cover"
  className="w-20 h-20 rounded-lg"
/>

// With placeholder and error handling
<CachedImage
  source={{ uri: exercise.imageUrl }}
  placeholder={require('@/assets/exercise-placeholder.png')}
  fallback={require('@/assets/error-image.png')}
  priority="high"
  onError={(error) => trackImageError(error)}
/>
```

---

## Available Components

### 1. CachedImage

**Purpose:** Optimized image loading with aggressive caching for instant retrieval.

**Status:** ✅ Production-ready

**Use Cases:**

- Exercise GIFs (1,300+ from ExerciseDB) - Phase 2.7.1, 3.11.2
- User avatars - Phase 1.4
- Workout template thumbnails - Phase 5

**Performance Requirements (PRD):**

- Load from cache in <200ms ✅
- Handle 1,300+ exercise images efficiently ✅
- Smooth UX with skeleton states ✅

---

## CachedImage API Reference

### Props

| Prop                   | Type                                                       | Default         | Description                             |
| ---------------------- | ---------------------------------------------------------- | --------------- | --------------------------------------- |
| **source**             | `ImageSource`                                              | _required_      | Image URI or local require()            |
| **style**              | `ViewStyle`                                                | `undefined`     | React Native style object               |
| **contentFit**         | `'cover' \| 'contain' \| 'fill' \| 'scale-down' \| 'none'` | `'cover'`       | How image resizes to fit container      |
| **placeholder**        | `ImageSource`                                              | `undefined`     | Skeleton/blur shown while loading       |
| **transition**         | `number`                                                   | `300`           | Fade-in duration (ms), set 0 to disable |
| **onError**            | `(error) => void`                                          | `undefined`     | Callback when image fails to load       |
| **fallback**           | `ImageSource`                                              | `undefined`     | Image shown on error                    |
| **cachePolicy**        | `'memory' \| 'disk' \| 'memory-disk' \| 'none'`            | `'memory-disk'` | Cache storage strategy                  |
| **priority**           | `'low' \| 'normal' \| 'high'`                              | `'normal'`      | Loading priority for preloading         |
| **className**          | `string`                                                   | `undefined`     | NativeWind (Tailwind) classes           |
| **accessibilityLabel** | `string`                                                   | `undefined`     | Screen reader label                     |
| **testID**             | `string`                                                   | `undefined`     | E2E testing identifier                  |

### Cache Policies

Choose the right policy for your use case:

| Policy             | Speed    | Persistence                | Best For                         |
| ------------------ | -------- | -------------------------- | -------------------------------- |
| **memory-disk** ⭐ | Fast     | Yes                        | Default - best for most images   |
| **memory**         | Fastest  | No (cleared on low memory) | High-res images shown frequently |
| **disk**           | Moderate | Yes                        | Rarely accessed images           |
| **none**           | Slow     | No                         | Sensitive/temporary images       |

**Default:** `memory-disk` (PRD requirement: <200ms cache retrieval)

### Priority Levels

Control image preloading for critical UX:

| Priority      | When to Use             | Example                      |
| ------------- | ----------------------- | ---------------------------- |
| **high**      | Above-fold, critical UX | Exercise selector thumbnails |
| **normal** ⭐ | Standard images         | Workout history thumbnails   |
| **low**       | Below-fold, background  | Lazy-loaded gallery images   |

---

## Usage Examples

### Basic Image

```typescript
<CachedImage
  source={{ uri: 'https://example.com/image.png' }}
  contentFit="cover"
  className="w-full h-48 rounded-lg"
/>
```

### Exercise GIF with Placeholder (Phase 2.7.1)

```typescript
<CachedImage
  source={{ uri: exercise.imageUrl }}
  placeholder={require('@/assets/exercise-placeholder.png')}
  fallback={require('@/assets/error-image.png')}
  contentFit="cover"
  priority="high"
  className="w-20 h-20 rounded-lg"
  accessibilityLabel={`${exercise.name} demonstration`}
/>
```

### User Avatar (Phase 1.4)

```typescript
import { CachedImage, CachedImageStyles } from '@/components/ui';

<CachedImage
  source={{ uri: user.avatarUrl }}
  placeholder={require('@/assets/avatar-placeholder.png')}
  fallback={require('@/assets/default-avatar.png')}
  style={CachedImageStyles.avatar}
  contentFit="cover"
  cachePolicy="memory-disk"
  testID="user-avatar"
/>
```

### Workout Template Thumbnail (Phase 5)

```typescript
<CachedImage
  source={{ uri: template.thumbnailUrl }}
  placeholder={{ blurhash: template.blurhash }}
  style={CachedImageStyles.thumbnailMedium}
  contentFit="cover"
  priority="normal"
  onError={(error) => {
    Sentry.captureMessage('Template thumbnail load failed', {
      extra: { templateId: template.id, error },
    });
  }}
/>
```

### Local Image (No Caching Needed)

```typescript
<CachedImage
  source={require('@/assets/onboarding-hero.png')}
  contentFit="contain"
  cachePolicy="none"
  transition={0}
  className="w-full h-64"
/>
```

---

## Best Practices

### 1. Choose the Right Cache Policy

```typescript
// ✅ GOOD: Default for remote images
<CachedImage source={{ uri: url }} />

// ✅ GOOD: No cache for local assets (already bundled)
<CachedImage source={require('@/assets/logo.png')} cachePolicy="none" />

// ❌ BAD: Using 'none' for frequently accessed remote images
<CachedImage source={{ uri: exerciseGif }} cachePolicy="none" />
```

### 2. Use Placeholders for Better UX

```typescript
// ✅ GOOD: Skeleton reduces perceived loading time
<CachedImage
  source={{ uri: url }}
  placeholder={require('@/assets/placeholder.png')}
/>

// ✅ GOOD: Blurhash for progressive loading
<CachedImage
  source={{ uri: url }}
  placeholder={{ blurhash: 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.' }}
/>

// ⚠️ OK: No placeholder (show nothing while loading)
<CachedImage source={{ uri: url }} />
```

### 3. Handle Errors Gracefully

```typescript
// ✅ GOOD: Fallback image + error tracking
<CachedImage
  source={{ uri: url }}
  fallback={require('@/assets/error-image.png')}
  onError={(error) => {
    Sentry.captureMessage('Image load failed', { extra: { url, error } });
  }}
/>

// ⚠️ OK: Just fallback (silent failure)
<CachedImage source={{ uri: url }} fallback={require('@/assets/error.png')} />

// ❌ BAD: No error handling (user sees broken image)
<CachedImage source={{ uri: url }} />
```

### 4. Optimize for Performance

```typescript
// ✅ GOOD: High priority for above-fold images
<CachedImage source={{ uri: url }} priority="high" />

// ✅ GOOD: Low priority for below-fold images
<CachedImage source={{ uri: url }} priority="low" />

// ✅ GOOD: Disable transition for instant display (when cached)
<CachedImage source={{ uri: url }} transition={0} />
```

### 5. Accessibility

```typescript
// ✅ GOOD: Descriptive label for screen readers
<CachedImage
  source={{ uri: exercise.imageUrl }}
  accessibilityLabel={`${exercise.name} demonstration GIF`}
/>

// ❌ BAD: No accessibility label (screen reader reads filename)
<CachedImage source={{ uri: url }} />
```

---

## Pre-built Styles

Use `CachedImageStyles` for common use cases:

```typescript
import { CachedImage, CachedImageStyles } from '@/components/ui';

// Avatar (80x80, circular)
<CachedImage source={{ uri: url }} style={CachedImageStyles.avatar} />

// Small thumbnail (60x60)
<CachedImage source={{ uri: url }} style={CachedImageStyles.thumbnailSmall} />

// Medium thumbnail (100x100)
<CachedImage source={{ uri: url }} style={CachedImageStyles.thumbnailMedium} />

// Exercise preview (120x120)
<CachedImage source={{ uri: url }} style={CachedImageStyles.exercisePreview} />

// Full-width banner (16:9)
<CachedImage source={{ uri: url }} style={CachedImageStyles.banner} />
```

Or combine with NativeWind:

```typescript
// Mix pre-built style with custom classes
<CachedImage
  source={{ uri: url }}
  style={CachedImageStyles.avatar}
  className="border-2 border-primary"
/>
```

---

## Performance Guidelines

### Image Optimization

Before using images in the app:

1. **Compress images** with `npx expo-optimize` (see expo-image docs)
2. **Use appropriate formats:**
   - JPEG for photos (smaller size)
   - PNG for logos/icons (transparency)
   - WebP for best compression (modern devices)
   - GIF for animations (or convert to WebP)
3. **Resize images** to target dimensions (don't load 2000px for 100px display)

### Preloading Critical Images

For images needed immediately on app launch:

```typescript
import { Image } from 'expo-image';

// In app/_layout.tsx or similar
useEffect(() => {
  // Preload exercise placeholders
  Image.prefetch([require('@/assets/exercise-placeholder.png'), require('@/assets/avatar-placeholder.png')]);
}, []);
```

### Memory Management

CachedImage handles memory automatically, but for large lists:

```typescript
import { FlashList } from '@shopify/flash-list';

// ✅ GOOD: FlashList recycles views, preventing memory bloat
<FlashList
  data={exercises}
  renderItem={({ item }) => (
    <CachedImage source={{ uri: item.imageUrl }} priority="low" />
  )}
  estimatedItemSize={100}
/>

// ❌ BAD: ScrollView loads all images at once (OOM on 1,300+ items)
<ScrollView>
  {exercises.map(ex => (
    <CachedImage source={{ uri: ex.imageUrl }} />
  ))}
</ScrollView>
```

---

## Troubleshooting

### Issue: Images not loading

**Possible Causes:**

1. Invalid URL (CORS, 404, auth required)
2. Network connectivity issues
3. Cache corruption

**Solutions:**

```typescript
// 1. Add error handling to diagnose
<CachedImage
  source={{ uri: url }}
  onError={(error) => console.log('Load failed:', error)}
/>

// 2. Try with fallback to test
<CachedImage
  source={{ uri: url }}
  fallback={require('@/assets/test-image.png')}
/>

// 3. Clear cache and retry (expo-image auto-manages, but can force)
// See expo-image docs for Image.clearDiskCache()
```

### Issue: Images loading slowly

**Possible Causes:**

1. Using wrong cache policy
2. Images not optimized (too large)
3. Low priority on critical images

**Solutions:**

```typescript
// 1. Use memory-disk for frequently accessed images
<CachedImage source={{ uri: url }} cachePolicy="memory-disk" />

// 2. Compress images with expo-optimize
// Run: npx expo-optimize

// 3. Set high priority for above-fold images
<CachedImage source={{ uri: url }} priority="high" />
```

### Issue: Placeholder not showing

**Possible Causes:**

1. Placeholder path incorrect
2. Placeholder loading slower than main image
3. Transition set to 0

**Solutions:**

```typescript
// 1. Verify placeholder exists
<CachedImage
  source={{ uri: url }}
  placeholder={require('@/assets/placeholder.png')} // Check path
/>

// 2. Use local placeholder (faster load)
// Don't use remote URL for placeholder

// 3. Ensure transition > 0 to see placeholder
<CachedImage source={{ uri: url }} transition={300} />
```

### Issue: Memory warnings on iOS

**Possible Causes:**

1. Too many images in memory cache
2. High-resolution images not optimized

**Solutions:**

```typescript
// 1. Use disk cache for less critical images
<CachedImage source={{ uri: url }} cachePolicy="disk" />

// 2. Reduce image resolution to display size
// Don't load 4K images for 100px thumbnails

// 3. Use FlashList for long lists (view recycling)
```

---

## Phase Integration Checklist

### Phase 1.4: User Profile (Avatars)

- [ ] Replace any Image imports with CachedImage
- [ ] Add avatar placeholder (design required)
- [ ] Add error fallback (default avatar)
- [ ] Use CachedImageStyles.avatar for consistency
- [ ] Add accessibility labels
- [ ] Test with slow network (3G throttling)

### Phase 2.7.1: Exercise Selector (Thumbnails)

- [ ] Use CachedImage for all exercise GIFs
- [ ] Set priority="high" for visible items
- [ ] Set priority="low" for below-fold items
- [ ] Add exercise placeholder (design required)
- [ ] Integrate with FlashList for performance
- [ ] Test with 1,300+ exercises (scroll performance)
- [ ] Verify <200ms cache retrieval (PRD requirement)

### Phase 3.11.2: Exercise Library (Full Catalog)

- [ ] Implement search filtering (keep CachedImage priority logic)
- [ ] Add image preloading for recently used exercises
- [ ] Test memory usage with all 1,300+ GIFs
- [ ] Add analytics for image load failures
- [ ] Consider lazy loading for off-screen images

### Phase 5: Workout Templates (Thumbnails)

- [ ] Use CachedImage for template preview images
- [ ] Generate blurhash placeholders (design team)
- [ ] Add template creation with image upload (expo-image-picker)
- [ ] Store images in Supabase Storage
- [ ] Cache template images aggressively (frequently accessed)

---

## Testing

### Manual Testing

1. **Cache Performance:**
   - Load image for first time (should see placeholder → image)
   - Kill app and relaunch
   - Load same image (should appear instantly from cache <200ms)

2. **Error Handling:**
   - Set source to invalid URL: `{ uri: 'https://invalid.test/404.png' }`
   - Should show fallback image
   - Should call onError callback

3. **Placeholder:**
   - Set slow network throttling (3G in Chrome DevTools)
   - Should see placeholder while loading
   - Should fade to main image on load

4. **Memory:**
   - Load 100+ images in FlashList
   - Scroll rapidly
   - Monitor memory usage (should stay stable, not grow infinitely)

### E2E Testing (Maestro - Phase 3+)

```yaml
# .maestro/flows/workout/image-loading.yaml
appId: com.halterofit.app
---
- launchApp
- tapOn:
    id: 'exercise-selector-button'
- assertVisible:
    id: 'exercise-image-0'
- assertVisible:
    id: 'exercise-image-placeholder'
- waitForAnimationToEnd
- assertVisible:
    id: 'exercise-image-loaded'
```

---

## References

- **expo-image Docs:** https://docs.expo.dev/versions/latest/sdk/image/
- **Cache Performance:** See PRD.md § Performance Requirements
- **Context7 Best Practices:** expo-image caching optimization
- **Project Architecture:** docs/ARCHITECTURE.md § Components/UI
- **Technical Decisions:** docs/TECHNICAL.md § ADR-010 Performance Libraries

---

## Decision Records

### Why CachedImage instead of just "Image"?

**Answer:** Name explicitly communicates performance guarantees

**Rationale:**

- Caching is a **product requirement** (PRD: <200ms load time)
- Auto-documented for team (name explains behavior)
- Follows React Native conventions (react-native-fast-image, react-native-cached-image)
- No confusion with React Native's base Image component

### Why wrapper instead of using expo-image directly?

**Answer:** Abstraction layer for consistency and future-proofing

**Benefits:**

- Centralized defaults (cachePolicy='memory-disk')
- Consistent error handling across app
- Easy to swap libraries if needed (change wrapper, not 100+ files)
- Enforces best practices (placeholder usage, accessibility)

**Example:**

```typescript
// ✅ GOOD: App-wide consistency
import { CachedImage } from '@/components/ui';

// ❌ BAD: Inconsistent configs across codebase
import { Image } from 'expo-image';
```

### Why memory-disk as default cache policy?

**Answer:** Best balance of speed and reliability

**Comparison:**

- `memory`: Fast but loses cache on app restart
- `disk`: Persistent but slower retrieval
- `memory-disk`: Fast retrieval + persistent ✅
- `none`: No caching (defeats purpose)

PRD requires <200ms cache retrieval → `memory-disk` is only option.

---

## Maintenance Notes

**Created:** 2025-01-31

**Next Review:** Phase 2.7.1 (When implementing ExerciseSelector)

**Future Enhancements:**

- Consider adding image compression helpers (expo-image-manipulator)
- Add prefetch utility for critical images
- Add analytics for cache hit/miss rates
- Consider adding WebP optimization guidelines

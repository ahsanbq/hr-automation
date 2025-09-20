# Font Usage Guide

## Default Font
**Manrope** is now the default font for ALL text content in the application.

## Available Fonts

This project includes two Google Fonts:
- **Manrope** - Default font for all text content (body, headings, UI elements)
- **Sora** - Alternative font for special headings and design elements

## Font Classes

### Sora Font Classes (for special use cases)
```css
.sora-light      /* Weight: 300 */
.sora-regular    /* Weight: 400 */
.sora-medium     /* Weight: 500 */
.sora-semibold   /* Weight: 600 */
.sora-bold       /* Weight: 700 */
.sora-extrabold  /* Weight: 800 */
```

### Manrope Font Classes (for weight variations)
```css
.manrope-light      /* Weight: 300 */
.manrope-regular    /* Weight: 400 */
.manrope-medium     /* Weight: 500 */
.manrope-semibold   /* Weight: 600 */
.manrope-bold       /* Weight: 700 */
.manrope-extrabold  /* Weight: 800 */
```

## Usage Examples

### Default Usage (Manrope applied automatically)
```jsx
// All these will use Manrope by default
<h1>Main Heading</h1>
<p>Body text</p>
<button>Button text</button>
<div>Any content</div>

// Ant Design components also use Manrope
<Card title="Card Title">Card content</Card>
<Button>Button</Button>
<Table columns={columns} dataSource={data} />
```

### Using Sora for Special Cases
```jsx
// Use Sora for special headings or design elements
<h1 className="sora-bold text-2xl">Special Heading</h1>
<h2 className="sora-semibold text-xl">Design Element</h2>
```

### Using Manrope Weight Variations
```jsx
// Override default weight if needed
<p className="manrope-bold">Bold text</p>
<span className="manrope-light">Light text</span>
```

### Tailwind CSS Classes
```jsx
// Use Tailwind font utilities
<div className="font-sans">Uses Manrope (default)</div>
<div className="font-manrope">Explicitly uses Manrope</div>
<div className="font-sora">Uses Sora</div>
```

## Implementation Details

### Global CSS Rules
- `*` selector applies Manrope to all elements
- Specific element selectors ensure coverage
- Ant Design components are overridden with `!important`
- Tailwind config sets Manrope as default sans-serif font

### Font Loading
- Google Fonts loaded in `_document.tsx`
- Preconnect for performance optimization
- Variable font weights (200-800 for Manrope, 100-800 for Sora)
- Display swap for better loading experience

## Best Practices
1. **Default**: Let Manrope apply automatically to all content
2. **Special Cases**: Use Sora classes only for design elements that need a different look
3. **Weight Variations**: Use Manrope weight classes when you need different font weights
4. **Consistency**: Stick to Manrope for most content to maintain consistency

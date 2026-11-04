import { ARROW_PATH, ARROW_TRANSFORM, COLORS } from '../animations/constructionAnimation';

/** Static version of the construction arrow, for decorative/directional use in markup. */
export default function ConstructionArrow({ color = 'red', className = 'size-3', ...rest }) {
  return (
    <svg viewBox="0 0 16 16" overflow="visible" aria-hidden="true" className={className} {...rest}>
      <path d={ARROW_PATH} transform={ARROW_TRANSFORM} fill={COLORS[color] ?? color} stroke="#080A12" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

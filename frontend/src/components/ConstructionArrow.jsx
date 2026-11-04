import { ARROW_PATH, COLORS } from '../animations/constructionAnimation';

/** Static version of the construction arrow, for decorative/directional use in markup. */
export default function ConstructionArrow({ color = 'red', className = 'size-3', ...rest }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} {...rest}>
      <path d={ARROW_PATH} fill={COLORS[color] ?? color} />
    </svg>
  );
}

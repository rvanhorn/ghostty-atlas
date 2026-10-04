import { Button as BaseButton } from "@base-ui/react/button";

export const Button = ({
  className = "",
  variant = "secondary",
  children,
  ...props
}) => (
  <BaseButton
    type="button"
    className={`button button--${variant} ${className}`}
    {...props}
  >
    {children}
  </BaseButton>
);

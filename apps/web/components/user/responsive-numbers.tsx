const ResponsiveNumber = ({ value, className }: { value: number; className: string }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace('.0', '') + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    }
    return num.toLocaleString();
  };

  return (
    <span className={className} title={value.toLocaleString()}>
      <span className="hidden sm:inline">{value.toLocaleString()}</span>
      <span className="sm:hidden">{formatNumber(value)}</span>
    </span>
  );
};

export default ResponsiveNumber;

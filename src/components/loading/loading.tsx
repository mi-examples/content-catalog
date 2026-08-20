import { Preloader } from '@metricinsights/pp-components';

const Loading = ({ label = 'Loading…' }: { label?: string }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 48,
      color: 'var(--text-secondary)',
    }}
  >
    <Preloader visible size="medium" />
    <span>{label}</span>
  </div>
);

export default Loading;

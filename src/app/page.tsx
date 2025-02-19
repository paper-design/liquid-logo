import Page from '@/app/share/[id]/page';

const APPLE_LOGO_ID = '01JMFN6GGTSR9TJ1P4MTDJNFNW';

export default function Home() {
  return (
    <Page
      params={
        new Promise((resolve) =>
          resolve({
            id: APPLE_LOGO_ID,
          })
        )
      }
    />
  );
}

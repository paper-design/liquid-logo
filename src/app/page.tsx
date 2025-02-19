import Page from '@/app/share/[id]/page';

const APPLE_LOGO_ID = '01JMEJ1N5330YWR605A6M5K1NF';

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

import Image from 'next/image';

const imageSize = 100;

const items = [
  {
    name: 'Nike',
    src: '/examples/nike-logo.svg',
    href: '/share/01JMEE5EHV87C6HC4WBWXWWP7A?refraction=0.015&edge=0.2&patternBlur=0.005&liquid=0.1&speed=0.3&patternScale=2',
  },
  { name: 'Starbucks', src: '/examples/starbucks-logo.svg', href: '/share/01JMEE8FQ7MBWB6756HE0H2Z7X?edge=0.5' },
  { name: 'Instagram', src: '/examples/instagram-logo.svg', href: '/share/01JMEEH0248X4H30HHDJ0ZR82G?edge=0.27' },
  { name: 'Chrome', src: '/examples/chrome-logo.png', href: '/share/01JMEEJ4D4FY78NAGM9KHFGC1P' },
  { name: 'Discord', src: '/examples/discord-logo.svg', href: '/share/01JMEGE08GE02EHJXSN7C3PTMB?edge=0.15' },
  { name: 'Vercel', src: '/examples/vercel-logo.png', href: '/share/01JMEEJT7W0GBQ8XSR1SJAGTTX?edge=0.15' },
  {
    name: 'Paper',
    src: '/examples/paper-logo.svg',
    href: '/share/01JMEEKFBH30VFX1M2CNQCTN1Q?refraction=0.015&edge=0.1&patternBlur=0.005&liquid=0.1&speed=0.3&patternScale=2',
  },
  { name: 'Sketch', src: '/examples/sketch-logo.svg', href: '/share/01JMEG4WPQS8CDSHPCPFWC6Y9V' },
  { name: 'Figma', src: '/examples/figma-logo.svg', href: '/share/01JMEG3C9PHK217797WNFTNKTY?edge=0.2' },
  { name: 'Rive', src: '/examples/rive-logo.svg', href: '/share/01JMEJ8S7A01SZ2AAH3RS5KXDW' },
  { name: 'Framer', src: '/examples/framer-logo.svg', href: '/share/01JMEGERCBVMGH2K0YDRHFA0TW' },
  { name: 'Adobe', src: '/examples/adobe-logo.svg', href: '/share/01JMEG862DSVYS09DFC1BKXZ4D' },
  { name: 'The Verge', src: '/examples/verge-logo.svg', href: '/share/01JMEG78BJG57YJ57HV88CBK5H' },
  { name: 'Supabase', src: '/examples/supabase-logo.png', href: '/share/01JMEENAEXX7XQPQ0S3TKH4MDW?edge=0.32' },
  { name: 'Basecase', src: '/examples/basecase-logo.svg', href: '/share/01JMEG8RB11D915QTP0GZP0SVQ' },
  { name: 'Cloudflare', src: '/examples/cloudflare-logo.svg', href: '/share/01JMEGAFSD7MATK7XQWSXT380J?edge=0.2' },
  {
    name: 'MacRumors',
    src: '/examples/mac-rumors-logo.svg',
    href: '/share/01JMEGF9RKBKMMG3YQ36DRNA58?refraction=0.015&edge=0.08&patternBlur=0.005&liquid=0.06&speed=0.3&patternScale=2.9',
  },
  { name: 'Radix UI', src: '/examples/radix-ui-logo.svg', href: '/share/01JMEGGDXSP26PJ3Y2BK8JWSWP' },
  { name: 'Slack', src: '/examples/slack-logo.svg', href: '/share/01JMEGKD0XF2ED9V12N579YHS8' },
  { name: 'Base UI', src: '/examples/base-ui-logo.svg', href: '/share/01JMEGJNXKTV5BFYXKKB7D6SJG' },
  { name: 'TechCrunch', src: '/examples/techcrunch-logo.svg', href: '/share/01JMEGM1NDM43411013XYVG30H' },
  { name: 'T3', src: '/examples/t3-logo.svg', href: '/share/01JMEM94AVB8WCM3C4QWCR3F2Y?edge=0.25' },
  { name: 'WorkOS', src: '/examples/workos-logo.svg', href: '/share/01JMEGMDP6B7TN1ST00VHFGB4S' },
  { name: 'Apple', src: '/examples/apple-logo.svg', href: '/' },
];

export function Examples() {
  return (
    <div className="grid w-full grid-cols-5 items-center justify-around gap-4">
      {items.map((item, index) => (
        <div key={index} className="flex w-full flex-col items-center">
          <a href={item.href} className="flex flex-col items-center">
            <div className="flex h-24 w-full items-center justify-center">
              <Image
                src={item.src}
                alt={`${item.name} Logo`}
                width={imageSize}
                height={imageSize}
                className="h-24 object-contain"
              />
            </div>
            <span className="mt-2 w-full">{item.name}</span>
          </a>
        </div>
      ))}
    </div>
  );
}

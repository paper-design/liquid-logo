import { PaperLogo } from '@/app/paper-logo';
import { Hero } from '@/hero/hero';
import NextLink from 'next/link';
import { Fragment, Suspense } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-between">
      <div className="relative mb-48 flex h-72 w-full items-center justify-between px-20 md:px-32">
        <a href="https://paper.design">
          <PaperLogo />
        </a>

        <span className="scale-80 pt-8 max-sm:scale-65 md:absolute md:left-1/2 md:-translate-x-1/2"></span>

        <span className="flex gap-24 pt-8 sm:gap-28">
          <NextLink className="hover:underline" href="https://x.com/paper">
            @paper
          </NextLink>
        </span>
      </div>

      <div className="pb-48 sm:pb-80">
        <Suspense>
          <Hero imageId={id} />
        </Suspense>
      </div>

      <div className="flex w-full gap-24 overflow-x-scroll overflow-y-hidden overscroll-x-contain p-16 pb-32 text-sm scrollbar-thin select-none *:first:ml-auto *:last:mr-auto">
        {logos.map((group, i) => (
          <Fragment key={i}>
            <div key={i} className="flex">
              {group.map(({ name, href, src }) => (
                <NextLink key={src} href={href} scroll={false} className="group flex flex-col gap-8 text-center">
                  <div className="flex h-100 w-160 items-center justify-center rounded-8 p-24 opacity-40 outline -outline-offset-1 outline-transparent transition-[opacity,outline] duration-150 group-hover:opacity-100 group-hover:outline-white/40 hover:duration-0">
                    <img alt={name + ' Logo'} src={src} className="h-52 w-152 object-contain" />
                  </div>
                  <span className="text-white/70">{name}</span>
                </NextLink>
              ))}
            </div>

            {i !== logos.length - 1 && <div className="h-100 w-1 shrink-0 bg-white/20" />}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

const logos = [
  [
    {
      name: 'Apple',
      href: '/',
      src: '/logos/apple.svg',
    },
    {
      name: 'Nike',
      href: '/share/01JMFN4FHEYQY3CBR7B4YBZFK9?edge=0.01',
      src: '/logos/nike.svg',
    },
    {
      name: 'NASA',
      href: '/share/01JMFN7R2E6WV297MM6EHBCAW6?edge=0.15',
      src: '/logos/nasa.svg',
    },
    {
      name: 'Chanel',
      href: '/share/01JMFNF83EX5DAVWF1TP1469BW?edge=0.15',
      src: '/logos/chanel.svg',
    },
    {
      name: 'Volkswagen',
      href: '/share/01JMFPD47QAN0FXMWWQC8YG8SY?edge=0.01',
      src: '/logos/volkswagen.svg',
    },
  ],
  [
    {
      name: 'Vercel',
      href: '/share/01JMFQ1ESB52205RRGSHCXHCZG?edgeBlur=0.01',
      src: '/logos/vercel.svg',
    },
    {
      name: 'Discord',
      href: '/share/01JMFQS93Q6R2VRQ62HTAA2AKG',
      src: '/logos/discord.svg',
    },
    // {
    //   name: 'Remix',
    //   href: '/share/01JMFQ533G3TVC21E96RSAG4KF',
    //   src: '/logos/remix.svg',
    // },
    {
      name: 'Paper',
      href: '/share/01JMP2MVEWNE5CZYXW94JQME35',
      src: '/logos/paper.svg',
    },
  ],
];

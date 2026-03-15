'use client';

import Link from 'next/link';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  HeartHandshake,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BackendAnnouncement,
  BackendPublicRankingGroup,
  BackendPublicRankingGroupSummary,
  BackendPublicSummary,
  getPublicRankings,
  getPublicSummary,
  listPublicAnnouncements,
  listPublicRankingGroups,
} from '@/lib/api';

const emptySummary: BackendPublicSummary = {
  schools: 0,
  projects: 0,
  categories: 0,
  donationsTotal: 0,
};

const heroDelay = (delay: number) =>
  ({
    '--hero-delay': `${delay}ms`,
  }) as CSSProperties;

const featuredLevelPriority = {
  national: 3,
  regional: 2,
  county: 1,
  sub_county: 0,
} as const;

const pickFeaturedRankingGroup = (groups: BackendPublicRankingGroupSummary[]) =>
  [...groups].sort((left, right) => {
    const leftPriority =
      featuredLevelPriority[left.competitionLevel as keyof typeof featuredLevelPriority] ?? -1;
    const rightPriority =
      featuredLevelPriority[right.competitionLevel as keyof typeof featuredLevelPriority] ?? -1;

    return (
      rightPriority - leftPriority ||
      left.categoryName.localeCompare(right.categoryName) ||
      (left.areaLabel || '').localeCompare(right.areaLabel || '')
    );
  })[0] || null;

export default function HomePage() {
  const [summary, setSummary] = useState<BackendPublicSummary>(emptySummary);
  const [featuredRankingGroup, setFeaturedRankingGroup] =
    useState<BackendPublicRankingGroup | null>(null);
  const [announcements, setAnnouncements] = useState<BackendAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingError, setRankingError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrimaryContent = async () => {
      setLoading(true);
      const [summaryResult, announcementsResult] = await Promise.allSettled([
        getPublicSummary(),
        listPublicAnnouncements(),
      ]);

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      }

      if (announcementsResult.status === 'fulfilled') {
        setAnnouncements(announcementsResult.value.slice(0, 3));
      }

      setLoading(false);
    };

    const loadFeaturedRanking = async () => {
      setRankingError(null);
      try {
        const groups = await listPublicRankingGroups();
        const featuredGroup = pickFeaturedRankingGroup(groups);

        if (!featuredGroup) {
          setFeaturedRankingGroup(null);
          return;
        }

        const rankingsData = await getPublicRankings({
          categoryId: featuredGroup.categoryId,
          competitionLevel: String(featuredGroup.competitionLevel),
          region: featuredGroup.region,
          county: featuredGroup.county,
          subCounty: featuredGroup.subCounty,
        });
        const selectedGroup = Array.isArray(rankingsData) ? rankingsData[0] : rankingsData;

        setFeaturedRankingGroup(selectedGroup || null);
      } catch (err: unknown) {
        setRankingError(err instanceof Error ? err.message : String(err));
        setFeaturedRankingGroup(null);
      }
    };

    loadPrimaryContent();
    loadFeaturedRanking();
  }, []);

  const topRankedProjects = useMemo(
    () =>
      (featuredRankingGroup?.rankings || []).slice(0, 4).map((project) => ({
        ...project,
        categoryName: featuredRankingGroup?.categoryName || '',
        areaLabel: featuredRankingGroup?.areaLabel || '',
      })),
    [featuredRankingGroup]
  );

  const stats = [
    { label: 'Participating schools', value: loading ? '...' : String(summary.schools) },
    { label: 'Projects in system', value: loading ? '...' : String(summary.projects) },
    { label: 'Project categories', value: loading ? '...' : String(summary.categories) },
    {
      label: 'Funds raised',
      value: loading ? '...' : `KES ${summary.donationsTotal.toLocaleString()}`,
    },
  ];

  return (
    <div className="page-shell">
      <PublicHeader />
      <section className="home-hero-scene relative min-h-[80vh] overflow-hidden">
        <div className="relative mx-auto grid min-h-[80vh] max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <div
              className="hero-copy-reveal mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-200"
              style={heroDelay(0)}
            >
              <BadgeCheck className="h-4 w-4" />
              Kenya Science &amp; Engineering Fair Digital System
            </div>
            <h1
              className="hero-copy-reveal max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl"
              style={heroDelay(90)}
            >
              A product of Ngao Girls High School students for project submission, judging and public rankings.
            </h1>
            <p
              className="hero-copy-reveal mt-6 max-w-2xl text-lg leading-8 text-slate-300"
              style={heroDelay(180)}
            >
              Built for real fair use, school showcase and possible sponsorship. The system supports patrons, judges, administrators and public viewers in one polished national-style workflow.
            </p>
            <div
              className="hero-copy-reveal mt-8 flex flex-wrap gap-4"
              style={heroDelay(270)}
            >
              <Button asChild size="lg" className="rounded-xl bg-blue-600 hover:bg-blue-500">
                <Link href="/login">
                  Open system <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/rankings">View published rankings</Link>
              </Button>
            </div>
          </div>
          <Card className="surface self-end p-2">
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-blue-200">
                  Why this system matters
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Designed for real KSEF workflow
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: ShieldCheck,
                    title: 'Blind judging',
                    copy: 'Judges score project code, title and category only.',
                  },
                  {
                    icon: Users,
                    title: '2-3 judge model',
                    copy: 'Works even where judges are limited and funds are tight.',
                  },
                  {
                    icon: Trophy,
                    title: 'Public rankings',
                    copy: 'Only top 4 qualify, while top 3 receive awards.',
                  },
                  {
                    icon: HeartHandshake,
                    title: 'Community support',
                    copy: 'Includes public donation flow for sponsors and well-wishers.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <item.icon className="h-5 w-5 text-blue-300" />
                    <h3 className="mt-3 font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-300">{item.copy}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="surface p-5">
              <p className="text-sm text-slate-300">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="surface p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-blue-200">
              Support the fair
            </p>
            <h2 className="mt-2 section-title">Help students get their ideas to the next stage</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Well-wishers, alumni, teachers, partners and sponsors can contribute to
              project materials, event-day logistics, judging support and student travel
              as projects move from sub-county to county, regionals and the national fair.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Button asChild className="rounded-xl bg-blue-600 hover:bg-blue-500">
                <Link href="/donate">Donate via M-Pesa</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/announcements">See current fair updates</Link>
              </Button>
            </div>
          </div>

          <div className="surface p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-blue-200">
              Donation impact
            </p>
            <div className="mt-4 space-y-4">
              {[
                'Project materials and prototype finishing',
                'Competition day coordination and venue support',
                'Student transport to county, regional and national stages',
                'Recognition for top projects and participation support',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
              <p className="text-sm text-slate-300">Total visible support so far</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                KES {summary.donationsTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="surface p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-blue-200">System flow</p>
          <h2 className="mt-2 section-title">How the KSEF process moves</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              [
                'Patron submission',
                'One patron per school submits 1-2 students per project before the deadline.',
              ],
              [
                'Judge scoring',
                'Trained judges transfer paper score sheets into Section A, B and C entry.',
              ],
              [
                'Score publishing',
                'Admin publishes category results only when the category is ready.',
              ],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-300">{copy}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-blue-200">
                  Current published leaders
                </p>
                <h2 className="mt-2 section-title">Top ranked projects</h2>
              </div>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/rankings">Open rankings</Link>
              </Button>
            </div>
            {rankingError ? (
              <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                {rankingError}
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {topRankedProjects.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    No published rankings are available yet.
                  </div>
                ) : (
                  topRankedProjects.map((item) => (
                    <div
                      key={item.projectId}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div>
                        <p className="text-sm text-blue-200">
                          #{item.rank} - {item.categoryName}
                        </p>
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <p className="text-sm text-slate-400">
                          {item.schoolName}
                          {item.areaLabel ? ` - ${item.areaLabel}` : ''}
                        </p>
                      </div>
                      <div className="rounded-xl bg-blue-500/15 px-3 py-2 text-sm font-semibold text-blue-100">
                        {item.finalScore.toFixed(1)} / 80
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-blue-200">
                  Latest announcements
                </p>
                <h2 className="mt-2 section-title">Public updates</h2>
              </div>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/announcements">Open announcements</Link>
              </Button>
            </div>
            <div className="mt-6 space-y-3">
              {announcements.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  No public announcements have been published yet.
                </div>
              ) : (
                announcements.map((item) => (
                  <Link
                    key={item._id}
                    href="/announcements"
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {item.content.length > 180
                        ? `${item.content.slice(0, 180)}...`
                        : item.content}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

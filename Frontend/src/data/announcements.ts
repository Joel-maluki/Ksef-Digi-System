import type { Announcement } from './types';

export const announcements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Sub-County submission closes in 7 days',
    audience: 'patron',
    body: 'All patrons must finalize project submission one week before the sub-county fair to support planning and judge allocation.',
    publishedAt: '2026-03-01T09:00:00Z',
  },
  {
    id: 'ann-2',
    title: 'Judges briefing and scoring guide',
    audience: 'judge',
    body: 'All trained judges are reminded to score physically first, then transfer Section A, B and C marks into the digital system.',
    publishedAt: '2026-03-02T10:00:00Z',
  },
  {
    id: 'ann-3',
    title: 'Published results now available',
    audience: 'public',
    body: 'Category rankings and top qualifiers can now be viewed on the public portal after publication by admin.',
    publishedAt: '2026-03-03T12:00:00Z',
  },
];

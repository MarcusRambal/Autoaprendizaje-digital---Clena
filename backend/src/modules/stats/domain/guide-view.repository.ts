export interface GuideViewRepository {
  track(guideId: string): Promise<'tracked' | 'guide-not-found'>;
}

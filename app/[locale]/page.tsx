import MainCarousel from './_components/home/MainCarousel'
import WeatherWidget from './_components/home/WeatherWidget'
import TrendingSpots from './_components/home/TrendingSpots'
import ExploreHub from './_components/home/ExploreHub'
import EditorialPicks from './_components/home/EditorialPicks'
import NewOnB4K from './_components/home/NewOnB4K'
import YouMightLike from './_components/home/YouMightLike'
import PlanTrip from './_components/home/PlanTrip'
import ContinuePlan from './_components/home/ContinuePlan'
import ChallengeCard from './_components/home/ChallengeCard'
import LeaderboardBadge from './_components/home/LeaderboardBadge'
import PopularPlans from './_components/home/PopularPlans'
import PartnerPackages from './_components/home/PartnerPackages'
import UpcomingEvents from './_components/home/UpcomingEvents'
import Promotions from './_components/home/Promotions'

export default function HomePage() {
  return (
    <div className="pb-sp-16">
      {/* 1 — Hero: full bleed */}
      <MainCarousel />

      {/* Sections contained to max 1280px */}
      <div className="max-w-[1280px] mx-auto">
        {/* 2 — Weather widget (hidden when no data) */}
        <WeatherWidget />

        {/* 3 — Trending Spots */}
        <TrendingSpots />

        {/* 4 — Explore Hub tiles */}
        <ExploreHub />

        {/* 5 — Editorial Picks */}
        <EditorialPicks />

        {/* 6 — New on B4K */}
        <NewOnB4K />

        {/* 7 — You Might Like (logged-in only) */}
        <YouMightLike />

        {/* 8 — Plan Your Trip CTA */}
        <PlanTrip />

        {/* 9 — Continue Your Plan (logged-in + active draft only) */}
        <ContinuePlan />

        {/* 10 — Challenge Card */}
        <ChallengeCard />

        {/* 11 — Leaderboard Snapshot + Badge Showcase */}
        <LeaderboardBadge />

        {/* 12 — Popular Plans */}
        <PopularPlans />

        {/* 13 — Partner Packages */}
        <PartnerPackages />

        {/* 14 — Upcoming Events */}
        <UpcomingEvents />

        {/* 15 — Promotions */}
        <Promotions />
      </div>
    </div>
  )
}

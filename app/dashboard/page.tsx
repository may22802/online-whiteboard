import { DashboardContent } from "./_components/dashboard-content";

interface DashboardPageProps {
  searchParams: Promise<{
    search?: string;
    favorites?: string;
  }>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const params = await searchParams;
  const query = {
    search: params.search,
    favorites: params.favorites,
  };

  return <DashboardContent query={query} />;
};

export default DashboardPage;

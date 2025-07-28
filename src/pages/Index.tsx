import { Navigation } from "@/components/Navigation";
import { ProductMaster } from "@/components/ProductMaster";
import { ASNManagement } from "@/components/ASNManagement";
import { Analytics } from "@/components/Analytics";
import { useGlobalState } from "@/hooks/useGlobalState";

const Index = () => {
  const { ui, actions } = useGlobalState();

  const renderContent = () => {
    switch (ui.activeTab) {
      case "products":
        return <ProductMaster />;
      case "asn":
        return <ASNManagement />;
      case "analytics":
        return <Analytics />;
      default:
        return <ProductMaster />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={ui.activeTab} onTabChange={actions.setActiveTab} />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;

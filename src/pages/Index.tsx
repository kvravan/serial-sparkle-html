import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { ProductMaster } from "@/components/ProductMaster";
import { ASNManagement } from "@/components/ASNManagement";
import { Analytics } from "@/components/Analytics";

const Index = () => {
  const [activeTab, setActiveTab] = useState("products");

  const renderContent = () => {
    switch (activeTab) {
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
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;

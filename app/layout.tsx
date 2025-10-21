import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster"
import "./globals.css";

export const metadata: Metadata = {
  title: "融链-军采服务中心价格公示平台",
  description: "融链-军采服务中心价格公示平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased flex flex-col min-h-screen">
        <main className="flex-grow">
          {children}
        </main>
        <footer className="bg-gray-100 text-gray-600 py-4">
          <div className="container mx-auto px-4 text-center text-xs">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0 text-center">
                <a href="https://beian.miit.gov.cn/#/Integrated/index" className="hover:underline">新ICP备2024012064号-3</a>
              </div>
              <div className="flex space-x-4">
                <p>© 2025新疆邦来惠信息科技有限公司. 版权所有.</p>
              </div>
            </div>
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}

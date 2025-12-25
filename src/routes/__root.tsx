import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import { AuthProvider } from "@/contexts/AuthContext";
import { NotFoundError } from "@/components/layout";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { GlobalLoading } from "@/components/ui/GlobalLoading";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Duite - uangmu terbang kemana",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  notFoundComponent: () => {
    return (
      <div className="min-h-screen bg-background">
        <NotFoundError onGoHome={() => (window.location.href = "/")} />
      </div>
    );
  },

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <AuthProvider>
            <GlobalLoading />
            {children}
            <TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          </AuthProvider>
        </ErrorBoundary>
        <Scripts />
      </body>
    </html>
  );
}

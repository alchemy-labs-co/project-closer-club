import { useEffect } from "react"
import { useFetcher } from "react-router"
import { Button } from "~/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "~/components/ui/drawer"
import { useIsMobile } from "~/hooks/use-mobile"
import type { AgentAnalytics } from "~/lib/admin/data-access/analytics/agent-analytics.server"
import AgentAnalyticsDisplay from "./agent-analytics-display"
import { Skeleton } from "~/components/ui/skeleton"


export default function AgentAnalayticsDrawer({ studentId }: { studentId: string }) {
    const isMobile = useIsMobile()
    const fetcher = useFetcher<AgentAnalytics>()
    
  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
        fetcher.load(`/resource/student-analytics/${studentId}`);
    }

  }, [studentId,fetcher])

  const isLoading = fetcher.state !== "idle"

    return (
              <Drawer direction={isMobile ? "bottom" : "right"}>
                <DrawerTrigger asChild>
                  <Button variant="link" className="text-foreground w-fit px-0 text-left">
                    View
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-dvh data-[vaul-drawer-direction=right]:sm:max-w-lg">
                    {isLoading && (
                      <Skeleton className="flex items-center justify-center p-8 h-full">
                        <div>Loading analytics...</div>
                      </Skeleton>
                    )}
                    {!isLoading && fetcher.data && (
                        <>
                        <DrawerHeader>
                          <DrawerTitle>Agent Analytics</DrawerTitle>
                          <DrawerDescription>
                            Course completion and progress analytics
                          </DrawerDescription>
                        </DrawerHeader>
                        <div className="flex-1 overflow-hidden px-4">
                          <AgentAnalyticsDisplay data={fetcher.data} />
                        </div>
                        </>
                    )}
                    {!isLoading && !fetcher.data && (
                      <div className="flex items-center justify-center p-8">
                        <p className="text-muted-foreground">No analytics data available</p>
                      </div>
                    )}
                </DrawerContent>
              </Drawer>
        )
}
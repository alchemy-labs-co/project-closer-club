import { useEffect } from "react"
import { useFetcher } from "react-router"
import { Button } from "~/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "~/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { useIsMobile } from "~/hooks/use-mobile"
import type { AgentAnalytics } from "~/lib/admin/data-access/analytics/agent-analytics.server"
import AgentAnalyticsDisplay from "./agent-analytics-display"
import CourseAnalyticsTab from "./course-analytics-tab"
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
                            Course completion, quiz performance, and progress analytics
                          </DrawerDescription>
                        </DrawerHeader>
                        <div className="flex-1 overflow-hidden">
                          <Tabs defaultValue="overview" className="h-full w-full flex flex-col">
                            <div className="px-4 pb-2">
                              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${1 + fetcher.data.courseCompletionAnalytics.courses.length}, 1fr)` }}>
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                {fetcher.data.courseCompletionAnalytics.courses.map((course) => (
                                  <TabsTrigger key={course.id} value={course.id} className="flex-1 truncate">
                                    {course.name || "Untitled"}
                                  </TabsTrigger>
                                ))}
                              </TabsList>
                            </div>
                            
                            <div className="flex-1 overflow-hidden">
                              <TabsContent value="overview" className="h-full overflow-y-auto px-4 mt-0">
                                <AgentAnalyticsDisplay data={fetcher.data} />
                              </TabsContent>
                              
                              {fetcher.data.courseCompletionAnalytics.courses.map((course) => (
                                <TabsContent key={course.id} value={course.id} className="h-full overflow-y-auto mt-0">
                                  <CourseAnalyticsTab course={course} />
                                </TabsContent>
                              ))}
                            </div>
                          </Tabs>
                        </div>
                        <DrawerFooter>
                          <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                          </DrawerClose>
                        </DrawerFooter>
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
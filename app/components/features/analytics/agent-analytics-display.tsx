import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Progress } from "~/components/ui/progress"
import { ScrollArea } from "~/components/ui/scroll-area"
import { BookOpen, CheckCircle, TrendingUp, Users } from "lucide-react"

interface Course {
  id: string
  name: string | null
  description: string | null
  thumbnailUrl: string | null
  slug: string | null
  totalLessons: number
  completedLessons: number
  progressPercentage: number
}

interface Summary {
  totalEnrolledCourses: number
  averageProgress: number
  totalLessons: number
  totalCompletedLessons: number
}

interface CourseCompletionAnalytics {
  success: boolean
  studentId: string
  courses: Course[]
  summary: Summary
}

interface AgentAnalyticsDisplayProps {
  data: { courseCompletionAnalytics: CourseCompletionAnalytics }
}

export default function AgentAnalyticsDisplay({ data }: AgentAnalyticsDisplayProps) {
  const { courseCompletionAnalytics } = data || {}
  
  if (!courseCompletionAnalytics || !courseCompletionAnalytics.success) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  const { courses, summary } = courseCompletionAnalytics

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEnrolledCourses}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageProgress}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLessons}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCompletedLessons}</div>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Course Progress</CardTitle>
          <CardDescription>
            Detailed progress for each enrolled course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px ] w-full flex flex-col gap-4 pb-8">
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                                         <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <h3 className="font-semibold text-sm truncate">{course.name || "Untitled Course"}</h3>
                         <Badge variant={course.progressPercentage === 100 ? "default" : "secondary"} className="text-xs">
                           {course.progressPercentage === 100 ? "Completed" : "In Progress"}
                         </Badge>
                       </div>
                       <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                         {course.description || "No description available"}
                       </p>
                     </div>
                     {course.thumbnailUrl && (
                       <div className="flex-shrink-0">
                         <img
                           src={`https://${course.thumbnailUrl}`}
                           alt={course.name || "Course thumbnail"}
                           className="w-16 h-12 rounded object-cover"
                         />
                       </div>
                     )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{course.completedLessons} of {course.totalLessons} lessons completed</span>
                      <span>{course.progressPercentage}%</span>
                    </div>
                    <Progress value={course.progressPercentage} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
} 
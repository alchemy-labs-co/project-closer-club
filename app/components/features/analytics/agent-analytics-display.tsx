import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
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

            {/* Course Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Courses</CardTitle>
          <CardDescription>
            Quick overview of all enrolled courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {course.thumbnailUrl && (
                    <img
                      src={`https://${course.thumbnailUrl}`}
                      alt={course.name || "Course thumbnail"}
                      className="w-10 h-8 rounded object-cover"
                    />
                  )}
                  <div>
                    <div className="font-medium text-sm">{course.name || "Untitled Course"}</div>
                    <div className="text-xs text-muted-foreground">
                      {course.completedLessons} of {course.totalLessons} lessons
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{course.progressPercentage}%</div>
                  <Badge variant={course.progressPercentage === 100 ? "default" : "secondary"} className="text-xs">
                    {course.progressPercentage === 100 ? "Completed" : "In Progress"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
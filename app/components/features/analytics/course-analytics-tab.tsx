import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Progress } from "~/components/ui/progress"

interface Course {
  id: string
  name: string | null
  description: string | null
  thumbnailUrl: string | null
  slug: string | null
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  // Quiz analytics
  totalQuizzes: number
  completedQuizzes: number
  quizCompletionPercentage: number
  averageQuizScore: number
  totalQuestionsAnswered: number
  totalCorrectAnswers: number
  overallAccuracy: number
}

interface CourseAnalyticsTabProps {
  course: Course
}

export default function CourseAnalyticsTab({ course }: CourseAnalyticsTabProps) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (course.progressPercentage / 100) * circumference

  // Quiz analytics calculations
  const quizStrokeDashoffset = circumference - (course.quizCompletionPercentage / 100) * circumference

  return (
    <div className="space-y-6 p-4">
      {/* Course Header */}
      <div className="flex items-start gap-4">
        {course.thumbnailUrl && (
          <div className="flex-shrink-0">
            <img
              src={`https://${course.thumbnailUrl}`}
              alt={course.name || "Course thumbnail"}
              className="w-20 h-15 rounded-lg object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold truncate">{course.name || "Untitled Course"}</h3>
            <Badge variant={course.progressPercentage === 100 ? "default" : "secondary"}>
              {course.progressPercentage === 100 ? "Completed" : "In Progress"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description || "No description available"}
          </p>
        </div>
      </div>

      {/* Dual Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lesson Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Progress</CardTitle>
            <CardDescription>Video lesson completion</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 144 144">
                {/* Background circle */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-muted/20"
                />
                {/* Progress circle */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="text-blue-500 transition-all duration-500 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-blue-500">
                  {course.progressPercentage}%
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {course.completedLessons}/{course.totalLessons}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Progress</CardTitle>
            <CardDescription>Quiz completion status</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 144 144">
                {/* Background circle */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-muted/20"
                />
                {/* Progress circle */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={quizStrokeDashoffset}
                  className="text-green-500 transition-all duration-500 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-green-500">
                  {course.quizCompletionPercentage}%
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {course.completedQuizzes}/{course.totalQuizzes}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Performance Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Performance</CardTitle>
          <CardDescription>Detailed quiz statistics and accuracy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Average Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Quiz Score</span>
              <span className="text-lg font-bold text-primary">{course.averageQuizScore}%</span>
            </div>
            <Progress value={course.averageQuizScore} className="h-3" />
          </div>

          {/* Overall Accuracy */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Accuracy</span>
              <span className="text-lg font-bold text-green-600">{course.overallAccuracy}%</span>
            </div>
            <Progress value={course.overallAccuracy} className="h-3" />
          </div>

          {/* Quiz Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{course.totalQuizzes}</div>
              <div className="text-xs text-muted-foreground">Total Quizzes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{course.completedQuizzes}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{course.totalQuestionsAnswered}</div>
              <div className="text-xs text-muted-foreground">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{course.totalCorrectAnswers}</div>
              <div className="text-xs text-muted-foreground">Correct Answers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Details */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completed Lessons</span>
              <span className="font-medium">{course.completedLessons}</span>
            </div>
            <Progress value={(course.completedLessons / course.totalLessons) * 100} />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Remaining Lessons</span>
              <span className="font-medium">{course.totalLessons - course.completedLessons}</span>
            </div>
            <Progress value={((course.totalLessons - course.completedLessons) / course.totalLessons) * 100} className="opacity-50" />
          </div>

          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{course.totalLessons}</div>
                <div className="text-xs text-muted-foreground">Total Lessons</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{course.completedLessons}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
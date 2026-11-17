/**
 * The reads and writes behind the lesson page: the course and its
 * curriculum, the Student's progress, the Discussion and the quiz.
 */
export {
  calculateWatchProgress,
  flattenCourseLessons,
  getCourseWithDetails,
  getLastWatchPosition,
  getLessonById,
  getLessonProgress,
  getLessonProgressForCourse,
  getModuleById,
  getUserById,
  markLessonComplete,
  markLessonInProgress,
} from "./lib/course.server";
export {
  getCommentById,
  getLessonThread,
  renderThread,
} from "./lib/discussion.server";
export {
  computeResult,
  getBestAttempt,
  getQuizByLessonId,
  getQuizWithQuestions,
} from "./lib/quiz.server";

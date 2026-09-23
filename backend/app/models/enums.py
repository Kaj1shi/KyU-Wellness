import enum


class UserRole(str, enum.Enum):
    STUDENT = "student"
    GUEST = "guest"
    COUNSELOR = "counselor"
    ADMIN = "admin"


class AssessmentType(str, enum.Enum):
    PHQ9 = "phq9"
    GAD7 = "gad7"
    STRESS = "stress"


class SeverityLevel(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"


class DistressLevel(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRISIS = "crisis"


class MessageSender(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class EscalationStatus(str, enum.Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class NotificationType(str, enum.Enum):
    CRISIS_ALERT = "crisis_alert"
    SYSTEM = "system"
    REMINDER = "reminder"

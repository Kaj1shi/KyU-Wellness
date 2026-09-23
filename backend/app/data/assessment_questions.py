"""Assessment question definitions and scoring thresholds."""

from app.models.enums import AssessmentType, SeverityLevel

# Standard 4-point Likert scale used across PHQ-9 and GAD-7
LIKERT_OPTIONS = [
    {"value": 0, "label": "Not at all"},
    {"value": 1, "label": "Several days"},
    {"value": 2, "label": "More than half the days"},
    {"value": 3, "label": "Nearly every day"},
]

STRESS_OPTIONS = [
    {"value": 0, "label": "Never"},
    {"value": 1, "label": "Almost never"},
    {"value": 2, "label": "Sometimes"},
    {"value": 3, "label": "Fairly often"},
    {"value": 4, "label": "Very often"},
]

ASSESSMENT_DEFINITIONS = {
    AssessmentType.PHQ9: {
        "title": "Depression Screening (PHQ-9)",
        "description": "Over the last 2 weeks, how often have you been bothered by the following?",
        "instructions": "This is a screening tool, not a diagnosis. Please answer honestly.",
        "options": LIKERT_OPTIONS,
        "max_score": 27,
        "questions": [
            {"id": "q1", "text": "Little interest or pleasure in doing things"},
            {"id": "q2", "text": "Feeling down, depressed, or hopeless"},
            {"id": "q3", "text": "Trouble falling or staying asleep, or sleeping too much"},
            {"id": "q4", "text": "Feeling tired or having little energy"},
            {"id": "q5", "text": "Poor appetite or overeating"},
            {"id": "q6", "text": "Feeling bad about yourself — or that you are a failure"},
            {"id": "q7", "text": "Trouble concentrating on things"},
            {
                "id": "q8",
                "text": "Moving or speaking slowly, or being fidgety/restless",
            },
            {
                "id": "q9",
                "text": "Thoughts that you would be better off dead or of hurting yourself",
            },
        ],
        "severity_thresholds": [
            (0, 9, SeverityLevel.LOW),
            (10, 14, SeverityLevel.MODERATE),
            (15, 27, SeverityLevel.HIGH),
        ],
        "severity_labels": {
            SeverityLevel.LOW: "Minimal to mild — monitor your mood and practice self-care",
            SeverityLevel.MODERATE: "Moderate — consider speaking with a counselor",
            SeverityLevel.HIGH: "Elevated — please reach out to a counselor or trusted person soon",
        },
    },
    AssessmentType.GAD7: {
        "title": "Anxiety Screening (GAD-7)",
        "description": "Over the last 2 weeks, how often have you been bothered by the following?",
        "instructions": "This is a screening tool, not a diagnosis.",
        "options": LIKERT_OPTIONS,
        "max_score": 21,
        "questions": [
            {"id": "q1", "text": "Feeling nervous, anxious, or on edge"},
            {"id": "q2", "text": "Not being able to stop or control worrying"},
            {"id": "q3", "text": "Worrying too much about different things"},
            {"id": "q4", "text": "Trouble relaxing"},
            {"id": "q5", "text": "Being so restless that it is hard to sit still"},
            {"id": "q6", "text": "Becoming easily annoyed or irritable"},
            {"id": "q7", "text": "Feeling afraid as if something awful might happen"},
        ],
        "severity_thresholds": [
            (0, 9, SeverityLevel.LOW),
            (10, 14, SeverityLevel.MODERATE),
            (15, 21, SeverityLevel.HIGH),
        ],
        "severity_labels": {
            SeverityLevel.LOW: "Minimal to mild anxiety — grounding exercises may help",
            SeverityLevel.MODERATE: "Moderate anxiety — speaking with support can help",
            SeverityLevel.HIGH: "High anxiety — please consider professional support",
        },
    },
    AssessmentType.STRESS: {
        "title": "Perceived Stress Scale (PSS-10)",
        "description": "In the last month, how often have you felt or thought the following?",
        "instructions": (
            "The Perceived Stress Scale (PSS-10) measures how unpredictable, uncontrollable, "
            "and overloaded you find your life. This is a screening tool, not a diagnosis."
        ),
        "options": STRESS_OPTIONS,
        "max_score": 40,
        "questions": [
            {
                "id": "q1",
                "text": "Been upset because of something that happened unexpectedly",
            },
            {
                "id": "q2",
                "text": "Felt that you were unable to control the important things in your life",
            },
            {
                "id": "q3",
                "text": "Felt nervous and stressed",
            },
            {
                "id": "q4",
                "text": "Felt confident about your ability to handle your personal problems",
                "reverse_scored": True,
            },
            {
                "id": "q5",
                "text": "Felt that things were going your way",
                "reverse_scored": True,
            },
            {
                "id": "q6",
                "text": "Found that you could not cope with all the things that you had to do",
            },
            {
                "id": "q7",
                "text": "Been able to control irritations in your life",
                "reverse_scored": True,
            },
            {
                "id": "q8",
                "text": "Felt that you were on top of things",
                "reverse_scored": True,
            },
            {
                "id": "q9",
                "text": "Been angered because of things that happened that were outside of your control",
            },
            {
                "id": "q10",
                "text": "Felt difficulties were piling up so high that you could not overcome them",
            },
        ],
        "severity_thresholds": [
            (0, 13, SeverityLevel.LOW),
            (14, 26, SeverityLevel.MODERATE),
            (27, 40, SeverityLevel.HIGH),
        ],
        "severity_labels": {
            SeverityLevel.LOW: "Low perceived stress — keep up healthy coping habits",
            SeverityLevel.MODERATE: "Moderate perceived stress — try relaxation and time management",
            SeverityLevel.HIGH: "High perceived stress — consider counseling and academic support",
        },
    },
}

WELLNESS_TIPS = {
    AssessmentType.PHQ9: {
        SeverityLevel.LOW: [
            "Stay connected with friends and family",
            "Maintain a regular sleep schedule",
            "Get some sunlight and gentle exercise daily",
        ],
        SeverityLevel.MODERATE: [
            "Talk to someone you trust about how you feel",
            "Break tasks into small, achievable steps",
            "Limit social media when feeling low",
            "Book a session with KyU counseling",
        ],
        SeverityLevel.HIGH: [
            "Please contact KyU Student Counselling Centre",
            "Reach out to a trusted friend, family member, or mentor",
            "Visit the Emergency Support page for hotlines",
            "You do not have to face this alone",
        ],
    },
    AssessmentType.GAD7: {
        SeverityLevel.LOW: [
            "Practice deep breathing for 5 minutes",
            "Write down worries and challenge unrealistic thoughts",
            "Limit caffeine intake",
        ],
        SeverityLevel.MODERATE: [
            "Try the 5-4-3-2-1 grounding technique",
            "Schedule worry time — 15 min then let go",
            "Consider speaking with a counselor",
        ],
        SeverityLevel.HIGH: [
            "Contact KyU counseling services",
            "Practice daily relaxation routines",
            "Avoid isolating yourself — reach out for support",
        ],
    },
    AssessmentType.STRESS: {
        SeverityLevel.LOW: [
            "Use a planner to organize your week",
            "Take short breaks between study sessions",
            "Stay hydrated and eat regular meals",
        ],
        SeverityLevel.MODERATE: [
            "Prioritize tasks using urgent/important matrix",
            "Ask lecturers or peers for academic support",
            "Schedule one enjoyable activity per week",
        ],
        SeverityLevel.HIGH: [
            "Speak with academic advisors about workload",
            "Contact KyU counseling for stress management",
            "Consider reducing non-essential commitments",
        ],
    },
}

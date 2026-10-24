use serde::Serialize;
use std::fmt;

/// A stable code that the frontend turns into text in the chosen language,
/// plus optional technical detail (tool output, OS errors) shown as-is.
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct AppError {
    pub code: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

impl AppError {
    pub fn new(code: &'static str) -> Self {
        Self { code, detail: None }
    }
    pub fn with(code: &'static str, detail: impl fmt::Display) -> Self {
        Self {
            code,
            detail: Some(detail.to_string()),
        }
    }
    /// For `map_err`: keeps the original error as detail.
    pub fn wrap<E: fmt::Display>(code: &'static str) -> impl FnOnce(E) -> Self {
        move |detail| Self::with(code, detail)
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match &self.detail {
            Some(detail) => write!(f, "{}: {detail}", self.code),
            None => f.write_str(self.code),
        }
    }
}

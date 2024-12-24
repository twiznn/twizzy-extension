export const getTimeDifference = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 1) {
    return "a day ago"
  } else if (diffDays < 30) {
    return `${diffDays} days ago`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} month${months > 1 ? "s" : ""} ago`
  } else {
    const years = Math.floor(diffDays / 365)
    return `${years} year${years > 1 ? "s" : ""} ago`
  }
}

export function sanitizeDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
}

export function calculateDomainAge(creationDate: string): string {
  const creation = new Date(creationDate)
  const now = new Date()
  const ageInMilliseconds = now.getTime() - creation.getTime()
  const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24))

  if (ageInDays < 30) {
    return `${ageInDays} days old`
  } else if (ageInDays < 365) {
    const months = Math.floor(ageInDays / 30)
    return `${months} months old`
  } else {
    const years = Math.floor(ageInDays / 365)
    return `${years} years old`
  }
}

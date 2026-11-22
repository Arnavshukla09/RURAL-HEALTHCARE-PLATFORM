/** Task cancellation invalidates reads, not a mutation already sent to a server. */
export class AssistantTaskLifetime {
  generation = 0
  controller = new AbortController()
  replace() {
    this.controller.abort()
    this.controller = new AbortController()
    return ++this.generation
  }
  owns(generation: number) { return this.generation === generation }
}

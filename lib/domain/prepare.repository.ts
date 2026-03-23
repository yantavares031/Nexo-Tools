export interface IPrepareRepository {
  prepare_db(): Promise<void>;
}

CREATE INDEX "chats_user_id_idx" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "symptoms_user_id_idx" ON "symptoms" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "medication_logs_user_id_idx" ON "medication_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "medication_logs_medication_id_idx" ON "medication_logs" USING btree ("medication_id");--> statement-breakpoint
CREATE INDEX "medications_user_id_idx" ON "medications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "appointments_user_id_idx" ON "appointments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "appointments_date_idx" ON "appointments" USING btree ("date");--> statement-breakpoint
CREATE INDEX "mood_logs_user_id_idx" ON "mood_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "allergies_user_id_idx" ON "allergies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "medical_history_user_id_idx" ON "medical_history" USING btree ("user_id");
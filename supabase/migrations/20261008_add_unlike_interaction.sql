alter table public.user_cafe_interactions
  drop constraint if exists user_cafe_interactions_type_check;

alter table public.user_cafe_interactions
  add constraint user_cafe_interactions_type_check
  check (interaction_type in ('LIKE', 'UNLIKE', 'SAVE', 'VISITED', 'NOT_INTERESTED'));

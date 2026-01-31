import { useEffect, useState } from 'react';
import { showForm, navigateTo } from '@devvit/web/client';

interface PostCreateFormValues {
  title: string;
  shortDescription?: string;
  callToAction?: string;
  votingExpiry: string;
}

interface CreateTierListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (postUrl: string) => void;
}

export const CreateTierListDialog = ({
  isOpen,
  onClose,
  onCreated,
}: CreateTierListDialogProps) => {
  useEffect(() => {
    if (isOpen) {
      fetch('/internal/menu/post-create', { method: 'POST' })
        .then((res) => res.json())
        .then(async (data) => {
          if (data?.showForm?.form) {
            const formDefinition = data.showForm.form;
            const rawResult = (await showForm(formDefinition)) as any;
            
            if (rawResult?.values) {
              const result = rawResult.values as PostCreateFormValues;
              const res = await fetch('/internal/form/post-create-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ values: result }),
              });
              const submitResult = await res.json();
              
              if (submitResult?.navigateTo) {
                onCreated(submitResult.navigateTo);
              } else if (submitResult?.showToast) {
                alert(submitResult.showToast);
              }
            }
          }
        })
        .catch((error) => {
          console.error('Error creating tier list:', error);
        })
        .finally(() => {
          onClose();
        });
    }
  }, [isOpen, onClose, onCreated]);

  return null;
};
